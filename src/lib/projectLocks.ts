import { supabase } from './supabase';
import { getErrorMessage } from './supabase';
import toast from 'react-hot-toast';

export interface ProjectLock {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  locked_at: string;
  last_activity: string;
  is_active: boolean;
}

class ProjectLockManager {
  private activeLocks: Map<string, ProjectLock> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  private subscribers: Set<(locks: ProjectLock[]) => void> = new Set();

  // Initialize the lock manager
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔒 Initializing Project Lock Manager...');
    
    try {
      // Load existing locks
      await this.loadActiveLocks();
      
      // Clean up stale locks
      await this.cleanupStaleLocks();
      
      // Set up real-time subscription
      this.subscribeToLockChanges();
      
      // Notify all subscribers with initial locks
      this.notifySubscribers();
      
      this.isInitialized = true;
      console.log('✅ Project Lock Manager initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing project lock manager:', error);
    }
  }

  // Load active locks from database
  private async loadActiveLocks() {
    try {
      console.log('📥 Loading active locks from database...');
      
      const { data: locks, error } = await supabase
        .from('project_locks')
        .select('*')
        .eq('is_active', true);

      if (error) {
        const errorMessage = getErrorMessage(error);
        console.error('Database error loading locks:', errorMessage);
        throw new Error(`Database error loading locks: ${errorMessage}`);
      }

      // Store locks in memory for fast access
      this.activeLocks.clear();
      locks?.forEach(lock => {
        this.activeLocks.set(lock.project_id, lock);
        console.log(`🔐 Loaded lock: Project ${lock.project_id} locked by ${lock.username}`);
      });
      
      console.log(`📊 Loaded ${locks?.length || 0} active locks`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Error loading active locks:', errorMessage);
      throw new Error(`Failed to load active locks: ${errorMessage}`);
    }
  }

  // Subscribe to real-time lock changes
  private subscribeToLockChanges() {
    console.log('🔄 Setting up real-time lock subscriptions...');
    
    // Subscribe to all lock changes with more specific event handling
    supabase
      .channel('project_locks_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_locks'
        },
        (payload) => {
          console.log('🔄 Lock change detected:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const lock = payload.new as ProjectLock;
            if (lock.is_active) {
              this.activeLocks.set(lock.project_id, lock);
              console.log(`🔒 Lock updated: Project ${lock.project_id} by ${lock.username}`);
            } else {
              this.activeLocks.delete(lock.project_id);
              console.log(`🔓 Lock removed: Project ${lock.project_id}`);
            }
            // Immediately notify all subscribers of the change
            this.notifySubscribers();
          } else if (payload.eventType === 'DELETE') {
            const lock = payload.old as ProjectLock;
            this.activeLocks.delete(lock.project_id);
            console.log(`🗑️ Lock deleted: Project ${lock.project_id}`);
            // Immediately notify all subscribers of the change
            this.notifySubscribers();
          }
        }
      )
      .subscribe();

    console.log('✅ Real-time subscription active');
    
    // Also set up a backup polling mechanism for extra reliability
    setInterval(async () => {
      try {
        await this.loadActiveLocks();
        this.notifySubscribers();
      } catch (error) {
        console.error('Error in backup polling:', error);
      }
    }, 10000); // Poll every 10 seconds as backup
  }

  // Check if a project is locked by another user
  async isProjectLocked(projectId: string, currentUserId: string): Promise<{ locked: boolean; lockInfo?: ProjectLock }> {
    console.log(`🔍 LOCK CHECK: Project ${projectId} by user ${currentUserId}`);
    
    try {
      // First check memory cache
      const cachedLock = this.activeLocks.get(projectId);
      console.log(`💾 CACHED LOCK for ${projectId}:`, cachedLock);
      
      if (cachedLock) {
        // Check if it's locked by someone else
        if (cachedLock.user_id !== currentUserId) {
          // Check if lock is stale
          const lockAge = Date.now() - new Date(cachedLock.last_activity).getTime();
          console.log(`⏰ LOCK AGE: ${Math.round(lockAge / 1000)} seconds (stale if > 300)`);
          
          if (lockAge > 5 * 60 * 1000) { // 5 minutes
            console.log('🧹 STALE LOCK DETECTED - cleaning up...');
            await this.forceUnlockProject(projectId);
            this.notifySubscribers();
            return { locked: false };
          }
          
            this.notifySubscribers();
          console.log(`🚫 PROJECT IS LOCKED by ${cachedLock.username} (user_id: ${cachedLock.user_id})`);
          return { locked: true, lockInfo: cachedLock };
        } else {
          console.log(`✅ USER OWNS LOCK - allowing access`);
          return { locked: false };
          this.notifySubscribers();
        }
      }

      // Double-check with database
      console.log(`🔍 NO CACHE - checking database for project ${projectId}...`);
      const { data: locks, error } = await supabase
        .from('project_locks')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('❌ DATABASE ERROR checking locks:', error);
        return { locked: false };
      }

      if (locks && locks.length > 0) {
        const lock = locks[0];
        console.log(`🔍 DATABASE LOCK FOUND:`, lock);
        
        // Check if it's locked by someone else
        if (lock.user_id !== currentUserId) {
          // Check if lock is stale
          const lockAge = Date.now() - new Date(lock.last_activity).getTime();
          console.log(`⏰ DATABASE LOCK AGE: ${Math.round(lockAge / 1000)} seconds`);
          
          if (lockAge > 5 * 60 * 1000) { // 5 minutes
            console.log('🧹 DATABASE LOCK IS STALE - cleaning up...');
            await this.forceUnlockProject(projectId);
            return { locked: false };
          }
          
          // Update cache
          this.activeLocks.set(projectId, lock);
          console.log(`🚫 PROJECT LOCKED BY ${lock.username} (user_id: ${lock.user_id}) - BLOCKING ACCESS`);
          return { locked: true, lockInfo: lock };
        } else {
          console.log(`✅ DATABASE LOCK OWNED BY CURRENT USER - allowing access`);
          // Update cache with user's own lock
          this.activeLocks.set(projectId, lock);
          return { locked: false };
        }
      } else {
        console.log(`✅ NO LOCKS FOUND - project ${projectId} is available`);
      }

      return { locked: false };
    } catch (error) {
      console.error('❌ CRITICAL ERROR checking project lock:', error);
      return { locked: false };
    }
  }

  // Lock a project for the current user
  async lockProject(projectId: string, userId: string, username: string): Promise<{ success: boolean; lockId?: string }> {
    console.log(`🔒 Attempting to lock project ${projectId} for user ${username} (${userId})`);
    
    try {
      // First check if project is already locked
      const lockCheck = await this.isProjectLocked(projectId, userId);
      if (lockCheck.locked) {
        console.log(`❌ Project already locked by ${lockCheck.lockInfo?.username}`);
        toast.error(`Project wordt momenteel bewerkt door ${lockCheck.lockInfo?.username}`);
        return { success: false };
      }

      // Remove any existing locks for this user on this project (cleanup)
      console.log('🧹 Cleaning up any existing locks...');
      await this.unlockProject(projectId, userId);

      // Try to create new lock
      console.log('🔒 Creating new lock...');
      const { data: lock, error } = await supabase
        .from('project_locks')
        .insert([{
          project_id: projectId,
          user_id: userId,
          username: username,
          is_active: true,
          locked_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating lock:', error);
        
        // If there's a unique constraint violation, someone else got the lock first
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          console.log('⚠️ Unique constraint violation - someone else locked first');
          // Re-check who has the lock now
          const recheckLock = await this.isProjectLocked(projectId, userId);
          if (recheckLock.locked) {
            toast.error(`Project wordt momenteel bewerkt door ${recheckLock.lockInfo?.username}`);
          }
          return { success: false };
        }
        
        toast.error('Kon project niet vergrendelen');
        return { success: false };
      }

      // Update cache
      this.activeLocks.set(projectId, lock);
      console.log(`💾 LOCK MANAGER: Added lock to cache for project ${projectId}`);
      console.log(`📊 LOCK MANAGER: Cache now contains ${this.activeLocks.size} locks`);

      // Start heartbeat for this lock
      this.startHeartbeat(lock.id, projectId);
      
      // Immediately notify all subscribers about the new lock
      console.log(`📢 LOCK MANAGER: Notifying ${this.subscribers.size} subscribers about new lock`);
      this.notifySubscribers();

      console.log(`✅ Successfully locked project ${projectId} for user ${username}`);
      toast.success('Project vergrendeld voor bewerking');
      return { success: true, lockId: lock.id };
    } catch (error) {
      console.error('❌ Error locking project:', error);
      toast.error('Kon project niet vergrendelen');
      return { success: false };
    }
  }

  // Unlock a project
  async unlockProject(projectId: string, userId: string): Promise<void> {
    console.log(`🔓 Unlocking project ${projectId} for user ${userId}`);
    
    try {
      // Stop heartbeat
      const heartbeatKey = `${projectId}-${userId}`;
      const interval = this.heartbeatIntervals.get(heartbeatKey);
      if (interval) {
        clearInterval(interval);
        this.heartbeatIntervals.delete(heartbeatKey);
        console.log('💓 Stopped heartbeat');
      }

      // Remove lock from database
      const { error } = await supabase
        .from('project_locks')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('Database error unlocking:', error);
      } else {
        console.log('✅ Database lock removed');
      }

      // Remove from cache
      this.activeLocks.delete(projectId);
      console.log('✅ Cache lock removed');
      
      // Force immediate notification to all subscribers
      console.log('📢 Force notifying subscribers after unlock');
      this.notifySubscribers();
      
      // Also force a fresh load from database to ensure consistency
      setTimeout(async () => {
        await this.loadActiveLocks();
        this.notifySubscribers();
      }, 500);

    } catch (error) {
      console.error('Error unlocking project:', error);
    }
  }

  // Force unlock a project (admin only)
  async forceUnlockProject(projectId: string): Promise<void> {
    console.log(`🔨 Force unlocking project ${projectId}`);
    
    try {
      // Stop any heartbeats for this project
      this.heartbeatIntervals.forEach((interval, key) => {
        if (key.startsWith(projectId)) {
          clearInterval(interval);
          this.heartbeatIntervals.delete(key);
        }
      });

      const { error } = await supabase
        .from('project_locks')
        .delete()
        .eq('project_id', projectId);

      if (error) {
        console.error('Error force unlocking:', error);
      } else {
        console.log('✅ Force unlock successful');
      }

      // Remove from cache
      this.activeLocks.delete(projectId);
      
      // Force immediate notification to all subscribers
      console.log('📢 Force notifying subscribers after force unlock');
      this.notifySubscribers();
      
      // Also force a fresh load from database to ensure consistency
      setTimeout(async () => {
        await this.loadActiveLocks();
        this.notifySubscribers();
      }, 500);
      
      toast.success('Project geforceerd ontgrendeld');
    } catch (error) {
      console.error('Error force unlocking project:', error);
      toast.error('Kon project niet forceren ontgrendelen');
    }
  }

  // Clean up stale locks
  private async cleanupStaleLocks(): Promise<void> {
    try {
      console.log('🧹 Cleaning up stale locks...');
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: staleLocks, error: selectError } = await supabase
        .from('project_locks')
        .select('*')
        .lt('last_activity', fiveMinutesAgo);

      if (selectError) {
        console.error('Error finding stale locks:', selectError);
        return;
      }

      if (staleLocks && staleLocks.length > 0) {
        console.log(`🧹 Found ${staleLocks.length} stale locks to clean up`);
        
        const { error: deleteError } = await supabase
          .from('project_locks')
          .delete()
          .lt('last_activity', fiveMinutesAgo);

        if (deleteError) {
          console.error('Error deleting stale locks:', deleteError);
        } else {
          console.log(`✅ Cleaned up ${staleLocks.length} stale locks`);
          
          // Remove from cache
          staleLocks.forEach(lock => {
            this.activeLocks.delete(lock.project_id);
          });
        }
      } else {
        console.log('✅ No stale locks found');
      }
    } catch (error) {
      console.error('Error cleaning up stale locks:', error);
    }
  }

  // Get all project locks
  async getAllProjectLocks(): Promise<ProjectLock[]> {
    try {
      const { data: locks, error } = await supabase
        .from('project_locks')
        .select('*')
        .eq('is_active', true)
        .order('locked_at', { ascending: false });

      if (error) {
        console.error('Error getting all locks:', error);
        return [];
      }
      
      console.log(`📊 Retrieved ${locks?.length || 0} active locks`);
      return locks || [];
    } catch (error) {
      console.error('Error getting project locks:', error);
      return [];
    }
  }

  // Start heartbeat to keep lock alive
  private startHeartbeat(lockId: string, projectId: string): void {
    const heartbeatKey = `${projectId}-${lockId}`;
    console.log(`💓 Starting heartbeat for lock ${lockId}`);
    
    const interval = setInterval(async () => {
      try {
        console.log(`💓 Heartbeat for project ${projectId}`);
        
        const { error } = await supabase
          .from('project_locks')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', lockId)
          .eq('is_active', true);

        if (error) {
          console.error('💔 Heartbeat failed:', error);
          clearInterval(interval);
          this.heartbeatIntervals.delete(heartbeatKey);
        } else {
          console.log('💓 Heartbeat successful');
        }
      } catch (error) {
        console.error('💔 Heartbeat error:', error);
        clearInterval(interval);
        this.heartbeatIntervals.delete(heartbeatKey);
      }
    }, 15000); // Every 15 seconds

    // Store interval for cleanup
    this.heartbeatIntervals.set(heartbeatKey, interval);
  }

  // Subscribe to all project locks (for dashboard/project list)
  subscribeToAllProjectLocks(callback: (locks: ProjectLock[]) => void): () => void {
    console.log('🔄 Setting up all project locks subscription...');
    
    // Add callback to subscribers
    this.subscribers.add(callback);
    
    // Immediately call with current locks
    this.loadAndNotifySubscriber(callback);

    return () => {
      console.log('🔄 Removing project locks subscriber');
      this.subscribers.delete(callback);
    };
  }

  // Load locks and immediately notify a specific subscriber
  private async loadAndNotifySubscriber(callback: (locks: ProjectLock[]) => void) {
    try {
      console.log('🔄 Loading fresh locks for new subscriber...');
      await this.loadActiveLocks();
      
      const currentLocks = Array.from(this.activeLocks.values());
      console.log(`📊 Sending ${currentLocks.length} fresh locks to subscriber`);
      console.log('🔒 Fresh lock details:', currentLocks.map(l => `${l.project_id.slice(0, 8)} by ${l.username}`));
      
      callback(currentLocks);
    } catch (error) {
      console.error('❌ Error loading locks for subscriber:', error);
      callback([]);
    }
  }

  // Notify all subscribers of lock changes
  private notifySubscribers() {
    const currentLocks = Array.from(this.activeLocks.values());
    console.log(`📢 Notifying ${this.subscribers.size} subscribers with ${currentLocks.length} locks`);
    console.log('🔒 Notifying with lock details:', currentLocks.map(l => `${l.project_id.slice(0, 8)} by ${l.username}`));
    
    this.subscribers.forEach(callback => {
      try {
        callback(currentLocks);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }
  
  // Force refresh locks from database and notify all subscribers
  async forceRefreshLocks(): Promise<void> {
    console.log('🔄 LOCK MANAGER: Force refreshing locks from database...');
    try {
      await this.loadActiveLocks();
      this.notifySubscribers();
      console.log('✅ LOCK MANAGER: Force refresh completed');
    } catch (error) {
      console.error('❌ LOCK MANAGER: Error during force refresh:', error);
    }
  }

  // Cleanup all intervals and subscriptions
  cleanup(): void {
    console.log('🧹 Cleaning up Project Lock Manager...');
    
    // Clear all heartbeat intervals
    this.heartbeatIntervals.forEach((interval, key) => {
      console.log(`💔 Stopping heartbeat: ${key}`);
      clearInterval(interval);
    });
    this.heartbeatIntervals.clear();
  }

  // Get time since lock was created
  getTimeSinceLocked(lockedAt: string): string {
    const now = new Date();
    const lockTime = new Date(lockedAt);
    const diffMs = now.getTime() - lockTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'zojuist';
    if (diffMins === 1) return '1 minuut';
    if (diffMins < 60) return `${diffMins} minuten`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 uur';
    return `${diffHours} uur`;
  }

  // Get time since last activity
  getTimeSinceActivity(lastActivity: string): string {
    const now = new Date();
    const activityTime = new Date(lastActivity);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'actief';
    if (diffMins === 1) return '1 min geleden';
    return `${diffMins} min geleden`;
  }

  // Debug method to show current state
  debugState(): void {
    console.log('🐛 Project Lock Manager Debug State:');
    console.log('📊 Active locks in memory:', this.activeLocks.size);
    console.log('💓 Active heartbeats:', this.heartbeatIntervals.size);
    console.log('🔧 Initialized:', this.isInitialized);
    
    this.activeLocks.forEach((lock, projectId) => {
      console.log(`  🔐 ${projectId}: ${lock.username} (${this.getTimeSinceActivity(lock.last_activity)})`);
    });
  }
}

// Export singleton instance
export const projectLockManager = new ProjectLockManager();

// Initialize on module load
projectLockManager.initialize();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    projectLockManager.cleanup();
  });
  
  // Add debug method to window for testing
  (window as any).debugLocks = () => projectLockManager.debugState();
}