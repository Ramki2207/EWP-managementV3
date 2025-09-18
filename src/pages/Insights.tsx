import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  Calendar, Filter, TrendingUp, Users, Building, Server, 
  Activity, BarChart3, PieChart as PieChartIcon, Target, FileDown, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';

const Insights = () => {
  const { hasPermission } = useEnhancedPermissions();
  const { currentUser } = useEnhancedPermissions();
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedClient, setSelectedClient] = useState('all');
  const [startDate, setStartDate] = useState(() => {
    const date = subMonths(new Date(), 11);
    return format(startOfMonth(date), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [chartData, setChartData] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [kpiData, setKpiData] = useState({
    totalProjects: 0,
    totalClients: 0,
    totalDistributors: 0,
    completedProjects: 0,
    activeProjects: 0,
    projectsThisMonth: 0,
    distributorsThisMonth: 0,
    clientsThisMonth: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (projects.length > 0 || distributors.length > 0 || clients.length > 0) {
      processChartData();
      calculateKPIs();
    }
  }, [timeRange, selectedClient, startDate, endDate, projects, distributors, clients]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load data from Supabase
      const [projectsData, distributorsData, clientsData] = await Promise.all([
        dataService.getProjects(),
        dataService.getDistributors(),
        dataService.getClients()
      ]);

      setProjects(projectsData || []);
      setDistributors(distributorsData || []);
      setClients(clientsData || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Er is een fout opgetreden bij het laden van de gegevens');
      
      // Fallback to localStorage if database fails
      try {
        const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        const localDistributors = JSON.parse(localStorage.getItem('distributors') || '[]');
        const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
        
        setProjects(localProjects);
        setDistributors(localDistributors);
        setClients(localClients);
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    // Filter data based on selected client
    let filteredProjects = selectedClient === 'all' 
      ? projects 
      : projects.filter((p: any) => p.client === selectedClient);

    // Role-based filtering for Tester users
    if (currentUser?.role === 'tester') {
      const beforeRoleFilter = filteredProjects.length;
      filteredProjects = filteredProjects.filter((p: any) => {
        const hasTestingStatus = p.status?.toLowerCase() === 'testen';
        
        if (!hasTestingStatus) {
          console.log(`🧪 INSIGHTS TESTER FILTER: Excluding project ${p.project_number} (status: ${p.status}) from insights for tester ${currentUser.username}`);
        }
        
        return hasTestingStatus;
      });
      console.log(`🧪 INSIGHTS TESTER FILTER: Filtered ${beforeRoleFilter} projects down to ${filteredProjects.length} for tester ${currentUser.username}`);
    }

    // Apply location filter based on user's assigned locations
    if (currentUser?.assignedLocations && currentUser.assignedLocations.length > 0) {
      if (currentUser.assignedLocations.length < AVAILABLE_LOCATIONS.length) {
        filteredProjects = filteredProjects.filter((p: any) => 
          !p.location || currentUser.assignedLocations.includes(p.location)
        );
      }
    }

    let filteredDistributors = selectedClient === 'all'
      ? distributors
      : distributors.filter((d: any) => {
          const project = projects.find((p: any) => p.id === d.project_id || p.project_number === d.projectnummer);
          return project?.client === selectedClient;
        });

    // Apply location filter for distributors too
    if (currentUser?.assignedLocations && currentUser.assignedLocations.length > 0) {
      if (currentUser.assignedLocations.length < AVAILABLE_LOCATIONS.length) {
        filteredDistributors = filteredDistributors.filter((d: any) => {
          const project = projects.find((p: any) => p.id === d.project_id || p.project_number === d.projectnummer);
          return !project?.location || currentUser.assignedLocations.includes(project.location);
        });
      }
    }

    // Calculate date range based on selected dates
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Process monthly data
    const monthlyData = [];
    let currentDate = start;

    while (currentDate <= end) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const monthProjects = filteredProjects.filter((p: any) => {
        const projectDate = new Date(p.created_at || p.date);
        return projectDate >= monthStart && projectDate <= monthEnd;
      }).length;

      const monthClients = clients.filter((c: any) => {
        const clientDate = new Date(c.created_at);
        return clientDate >= monthStart && clientDate <= monthEnd;
      }).length;

      const monthDistributors = filteredDistributors.filter((d: any) => {
        const distributorDate = new Date(d.created_at);
        return distributorDate >= monthStart && distributorDate <= monthEnd;
      }).length;

      monthlyData.push({
        month: format(currentDate, 'MMM yyyy', { locale: nl }),
        monthShort: format(currentDate, 'MMM', { locale: nl }),
        projects: monthProjects,
        clients: monthClients,
        distributors: monthDistributors,
        total: monthProjects + monthClients + monthDistributors
      });

      currentDate = subMonths(currentDate, -1);
    }

    setChartData(monthlyData);
  };

  const calculateKPIs = () => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    
    const completedCount = projects.filter((p: any) => 
      p.status?.toLowerCase() === 'opgeleverd' || p.status?.toLowerCase() === 'completed'
    ).length;
    
    const activeCount = projects.filter((p: any) => 
      p.status && !['opgeleverd', 'completed', 'verloren', 'cancelled'].includes(p.status.toLowerCase())
    ).length;

    const projectsThisMonth = projects.filter((p: any) => {
      const projectDate = new Date(p.created_at || p.date);
      return projectDate >= thisMonthStart;
    }).length;

    const distributorsThisMonth = distributors.filter((d: any) => {
      const distributorDate = new Date(d.created_at);
      return distributorDate >= thisMonthStart;
    }).length;

    const clientsThisMonth = clients.filter((c: any) => {
      const clientDate = new Date(c.created_at);
      return clientDate >= thisMonthStart;
    }).length;

    setKpiData({
      totalProjects: projects.length,
      totalClients: clients.length,
      totalDistributors: distributors.length,
      completedProjects: completedCount,
      activeProjects: activeCount,
      projectsThisMonth,
      distributorsThisMonth,
      clientsThisMonth,
    });
  };

  const handleQuickDateSelect = (range: string) => {
    const end = new Date();
    let start;

    switch (range) {
      case 'this_month':
        start = startOfMonth(end);
        break;
      case 'this_quarter':
        start = subMonths(end, 3);
        break;
      case 'this_year':
        start = subMonths(end, 11);
        break;
      case '6m':
        start = subMonths(end, 5);
        break;
      default:
        start = subMonths(end, 11);
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
    setTimeRange(range);
  };

  const generatePDFReport = async () => {
    if (!hasPermission('insights', 'export')) {
      toast.error('Je hebt geen toestemming om rapporten te exporteren');
      return;
    }

    try {
      setGeneratingReport(true);
      toast('Rapport wordt gegenereerd...');

      // Create a new jsPDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235); // Blue color
      pdf.text('Business Inzichten Rapport', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128); // Gray color
      pdf.text(`Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`, 20, yPosition);
      pdf.text(`Periode: ${format(parseISO(startDate), 'dd MMM yyyy', { locale: nl })} - ${format(parseISO(endDate), 'dd MMM yyyy', { locale: nl })}`, 20, yPosition + 5);
      
      yPosition += 20;

      // Add KPI section
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('📊 Belangrijkste Cijfers', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      const kpiItems = [
        { label: 'Totale Projecten', value: kpiData.totalProjects },
        { label: 'Actieve Projecten', value: kpiData.activeProjects },
        { label: 'Totale Klanten', value: kpiData.totalClients },
        { label: 'Verdelers', value: kpiData.totalDistributors },
        { label: 'Projecten deze maand', value: kpiData.projectsThisMonth },
        { label: 'Klanten deze maand', value: kpiData.clientsThisMonth },
        { label: 'Verdelers deze maand', value: kpiData.distributorsThisMonth }
      ];

      kpiItems.forEach((item, index) => {
        const x = 20 + (index % 2) * 90;
        const y = yPosition + Math.floor(index / 2) * 8;
        pdf.text(`${item.label}: ${item.value}`, x, y);
      });

      yPosition += Math.ceil(kpiItems.length / 2) * 8 + 15;

      // Add charts section
      pdf.setFontSize(16);
      pdf.text('📈 Grafieken en Trends', 20, yPosition);
      yPosition += 15;

      // Capture charts as images
      const chartElements = document.querySelectorAll('.recharts-wrapper');
      
      for (let i = 0; i < Math.min(chartElements.length, 3); i++) {
        const element = chartElements[i] as HTMLElement;
        
        try {
          const canvas = await html2canvas(element, {
            backgroundColor: '#1E2530',
            scale: 2,
            logging: false,
            useCORS: true
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if we need a new page
          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 15;
        } catch (error) {
          console.error('Error capturing chart:', error);
        }
      }

      // Add data table
      if (yPosition + 50 > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.text('📋 Maandelijkse Data', 20, yPosition);
      yPosition += 15;

      // Table headers
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Maand', 20, yPosition);
      pdf.text('Projecten', 60, yPosition);
      pdf.text('Klanten', 100, yPosition);
      pdf.text('Verdelers', 140, yPosition);
      yPosition += 8;

      // Table data
      pdf.setTextColor(0, 0, 0);
      chartData.slice(-6).forEach((data) => {
        pdf.text(data.month, 20, yPosition);
        pdf.text(data.projects.toString(), 60, yPosition);
        pdf.text(data.clients.toString(), 100, yPosition);
        pdf.text(data.distributors.toString(), 140, yPosition);
        yPosition += 6;
      });

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text('© 2025 Process Improvement B.V. - EWP Management System', 20, pageHeight - 10);

      // Generate filename with current date
      const filename = `EWP_Inzichten_Rapport_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      // Download the PDF
      pdf.save(filename);
      
      toast.success('Rapport succesvol gegenereerd en gedownload!');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Er is een fout opgetreden bij het genereren van het rapport');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusDistribution = () => {
    const statusCounts = projects.reduce((acc: any, project: any) => {
      const status = project.status || 'Onbekend';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: Math.round((count as number / projects.length) * 100)
    }));
  };

  const getKPIChange = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, trend: 'neutral' };
    const change = Math.round(((current - previous) / previous) * 100);
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    return { change: Math.abs(change), trend };
  };

  const statusColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Inzichten laden...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📊 Business Inzichten</h1>
            <h1 className="text-3xl font-bold text-white mb-2">📊 EWP Inzichten</h1>
            <p className="text-gray-400">Krijg inzicht in je bedrijfsprestaties en trends</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={generatePDFReport}
              disabled={generatingReport}
              className={`btn-primary flex items-center space-x-2 ${
                generatingReport ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Genereren...</span>
                </>
              ) : (
                <>
                  <FileDown size={20} />
                  <span>Rapport Genereren</span>
                </>
              )}
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Activity size={16} />
              <span>Live data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Filter className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold">Filters & Periode</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Quick date selections */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Snelle selectie</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Deze maand', value: 'this_month' },
                { label: 'Kwartaal', value: 'this_quarter' },
                { label: '6 maanden', value: '6m' },
                { label: 'Dit jaar', value: 'this_year' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleQuickDateSelect(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition ${
                    timeRange === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#2A303C] text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Start datum</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">Eind datum</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>

          {/* Client filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Klant filter</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="input-field"
            >
              <option value="all">Alle klanten</option>
              {clients.map((client: any) => (
                <option key={client.id} value={client.name}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'Totale Projecten',
            value: kpiData.totalProjects,
            change: kpiData.projectsThisMonth,
            changeLabel: 'deze maand',
            icon: Building,
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600'
          },
          {
            title: 'Actieve Projecten',
            value: kpiData.activeProjects,
            change: Math.round((kpiData.activeProjects / Math.max(kpiData.totalProjects, 1)) * 100),
            changeLabel: 'van totaal',
            icon: Activity,
            color: 'green',
            gradient: 'from-green-500 to-green-600'
          },
          {
            title: 'Totale Klanten',
            value: kpiData.totalClients,
            change: kpiData.clientsThisMonth,
            changeLabel: 'deze maand',
            icon: Users,
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600'
          },
          {
            title: 'Verdelers',
            value: kpiData.totalDistributors,
            change: kpiData.distributorsThisMonth,
            changeLabel: 'deze maand',
            icon: Server,
            color: 'orange',
            gradient: 'from-orange-500 to-orange-600'
          }
        ].map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="card p-6 relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-5`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${kpi.color}-500/20`}>
                    <Icon size={24} className={`text-${kpi.color}-400`} />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm">
                      {kpi.change > 0 ? (
                        <ArrowUpRight size={16} className="text-green-400" />
                      ) : kpi.change < 0 ? (
                        <ArrowDownRight size={16} className="text-red-400" />
                      ) : (
                        <Minus size={16} className="text-gray-400" />
                      )}
                      <span className={`${
                        kpi.change > 0 ? 'text-green-400' : 
                        kpi.change < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {kpi.change}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{kpi.changeLabel}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">{kpi.title}</h3>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Trends */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp size={20} className="text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold">Maandelijkse Trends</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="projectsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="distributorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="monthShort" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E2530',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="projects" 
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#projectsGradient)"
                name="Projecten"
              />
              <Area 
                type="monotone" 
                dataKey="distributors" 
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#distributorsGradient)"
                name="Verdelers"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <PieChartIcon size={20} className="text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold">Project Status Verdeling</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getStatusDistribution()}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {getStatusDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E2530',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Activity Bar Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <BarChart3 size={20} className="text-green-400" />
              </div>
              <h2 className="text-lg font-semibold">Maandelijkse Activiteit</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="monthShort" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E2530',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="projects" fill="#3B82F6" name="Projecten" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clients" fill="#F59E0B" name="Klanten" radius={[4, 4, 0, 0]} />
              <Bar dataKey="distributors" fill="#10B981" name="Verdelers" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Metrics */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Target size={20} className="text-orange-400" />
              </div>
              <h2 className="text-lg font-semibold">Groei Metrics</h2>
            </div>
          </div>
          <div className="space-y-6">
            {[
              {
                label: 'Project Voltooiingspercentage',
                value: Math.round((kpiData.completedProjects / Math.max(kpiData.totalProjects, 1)) * 100),
                max: 100,
                color: 'bg-green-500'
              },
              {
                label: 'Actieve Projecten',
                value: Math.round((kpiData.activeProjects / Math.max(kpiData.totalProjects, 1)) * 100),
                max: 100,
                color: 'bg-blue-500'
              },
              {
                label: 'Verdelers per Project',
                value: Math.round((kpiData.totalDistributors / Math.max(kpiData.totalProjects, 1)) * 10) * 10,
                max: 100,
                color: 'bg-purple-500'
              }
            ].map((metric, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">{metric.label}</span>
                  <span className="text-sm font-semibold text-white">{metric.value}%</span>
                </div>
                <div className="w-full bg-[#2A303C] rounded-full h-2">
                  <div 
                    className={`${metric.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">📈 Prestatie Overzicht</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Afgeronde Projecten</span>
              <span className="font-semibold text-green-400">{kpiData.completedProjects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Lopende Projecten</span>
              <span className="font-semibold text-blue-400">{kpiData.activeProjects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Gemiddeld Verdelers/Project</span>
              <span className="font-semibold text-purple-400">
                {kpiData.totalProjects > 0 ? (kpiData.totalDistributors / kpiData.totalProjects).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-400">🎯 Deze Maand</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Nieuwe Projecten</span>
              <span className="font-semibold text-blue-400">{kpiData.projectsThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Nieuwe Klanten</span>
              <span className="font-semibold text-purple-400">{kpiData.clientsThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Nieuwe Verdelers</span>
              <span className="font-semibold text-green-400">{kpiData.distributorsThisMonth}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 text-orange-400">📊 Statistieken</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Voltooiingspercentage</span>
              <span className="font-semibold text-green-400">
                {kpiData.totalProjects > 0 ? Math.round((kpiData.completedProjects / kpiData.totalProjects) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Actief Percentage</span>
              <span className="font-semibold text-blue-400">
                {kpiData.totalProjects > 0 ? Math.round((kpiData.activeProjects / kpiData.totalProjects) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Totale Entiteiten</span>
              <span className="font-semibold text-white">
                {kpiData.totalProjects + kpiData.totalClients + kpiData.totalDistributors}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;