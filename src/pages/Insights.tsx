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
import ewpLogo from '../assets/ewp-logo.png';

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
  const [workEntries, setWorkEntries] = useState<any[]>([]);
  const [hoursData, setHoursData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [phaseData, setPhaseData] = useState<any[]>([]);
  const [estimatedVsActualData, setEstimatedVsActualData] = useState<any[]>([]);
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
    totalHours: 0,
    totalHoursThisMonth: 0,
    avgHoursPerProject: 0,
    activeEmployees: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (projects.length > 0 || distributors.length > 0 || clients.length > 0 || workEntries.length > 0) {
      processChartData();
      processHoursData();
      processPhaseData();
      processEstimatedVsActual();
      calculateKPIs();
    }
  }, [timeRange, selectedClient, startDate, endDate, projects, distributors, clients, workEntries]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load data from Supabase
      const { data: workEntriesData } = await dataService.supabase
        .from('work_entries')
        .select(`
          *,
          worker:users!work_entries_worker_id_fkey(id, username),
          distributor:distributors(id, distributor_id, project_id)
        `)
        .order('date', { ascending: false });

      const [projectsData, distributorsData, clientsData] = await Promise.all([
        dataService.getProjects(),
        dataService.getDistributors(),
        dataService.getClients()
      ]);

      setProjects(projectsData || []);
      setDistributors(distributorsData || []);
      setClients(clientsData || []);
      setWorkEntries(workEntriesData || []);
      
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

      const monthWorkEntries = workEntries.filter((w: any) => {
        const workDate = new Date(w.date);
        return workDate >= monthStart && workDate <= monthEnd;
      });

      const monthHours = monthWorkEntries.reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0);

      monthlyData.push({
        month: format(currentDate, 'MMM yyyy', { locale: nl }),
        monthShort: format(currentDate, 'MMM', { locale: nl }),
        projects: monthProjects,
        clients: monthClients,
        distributors: monthDistributors,
        hours: Math.round(monthHours * 10) / 10,
        total: monthProjects + monthClients + monthDistributors
      });

      currentDate = subMonths(currentDate, -1);
    }

    setChartData(monthlyData);
  };

  const processHoursData = () => {
    // Calculate hours per month
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const monthlyHours = [];
    let currentDate = start;

    while (currentDate <= end) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const monthWorkEntries = workEntries.filter((w: any) => {
        const workDate = new Date(w.date);
        return workDate >= monthStart && workDate <= monthEnd;
      });

      const totalHours = monthWorkEntries.reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0);
      const uniqueWorkers = new Set(monthWorkEntries.map((w: any) => w.worker_id)).size;
      const avgHoursPerWorker = uniqueWorkers > 0 ? totalHours / uniqueWorkers : 0;

      monthlyHours.push({
        month: format(currentDate, 'MMM yyyy', { locale: nl }),
        monthShort: format(currentDate, 'MMM', { locale: nl }),
        hours: Math.round(totalHours * 10) / 10,
        workers: uniqueWorkers,
        avgHours: Math.round(avgHoursPerWorker * 10) / 10
      });

      currentDate = subMonths(currentDate, -1);
    }

    setHoursData(monthlyHours);

    // Calculate employee productivity
    const employeeStats = workEntries.reduce((acc: any, entry: any) => {
      const workerName = entry.worker?.username || 'Onbekend';
      if (!acc[workerName]) {
        acc[workerName] = {
          name: workerName,
          hours: 0,
          entries: 0,
          verdelers: new Set()
        };
      }
      acc[workerName].hours += parseFloat(entry.hours) || 0;
      acc[workerName].entries += 1;
      if (entry.distributor_id) {
        acc[workerName].verdelers.add(entry.distributor_id);
      }
      return acc;
    }, {});

    const employeeArray = Object.values(employeeStats)
      .map((emp: any) => ({
        name: emp.name,
        hours: Math.round(emp.hours * 10) / 10,
        entries: emp.entries,
        verdelers: emp.verdelers.size,
        avgHoursPerEntry: emp.entries > 0 ? Math.round((emp.hours / emp.entries) * 10) / 10 : 0
      }))
      .sort((a: any, b: any) => b.hours - a.hours)
      .slice(0, 10);

    setEmployeeData(employeeArray);
  };

  const processPhaseData = () => {
    // Calculate total hours per phase
    const phaseStats = workEntries.reduce((acc: any, entry: any) => {
      const phase = entry.phase || 'overig';
      if (!acc[phase]) {
        acc[phase] = {
          name: phase,
          hours: 0,
          count: 0
        };
      }
      acc[phase].hours += parseFloat(entry.hours) || 0;
      acc[phase].count += 1;
      return acc;
    }, {});

    const phaseArray = Object.values(phaseStats).map((phase: any) => ({
      name: phase.name === 'werkvoorbereiding' ? 'Werkvoorbereiding' :
            phase.name === 'productie' ? 'Productie' :
            phase.name === 'testen' ? 'Testen' : 'Overig',
      hours: Math.round(phase.hours * 10) / 10,
      count: phase.count,
      avgHours: phase.count > 0 ? Math.round((phase.hours / phase.count) * 10) / 10 : 0
    }));

    setPhaseData(phaseArray);
  };

  const processEstimatedVsActual = () => {
    // Calculate estimated vs actual hours per verdeler
    const verdelerStats = distributors.map((distributor: any) => {
      // Get all work entries for this distributor
      const verdelerEntries = workEntries.filter((w: any) => w.distributor_id === distributor.id);

      // Calculate actual hours by phase
      const actualWerkvoorbereiding = verdelerEntries
        .filter((w: any) => w.phase === 'werkvoorbereiding')
        .reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0);

      const actualProductie = verdelerEntries
        .filter((w: any) => w.phase === 'productie')
        .reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0);

      const actualTesten = verdelerEntries
        .filter((w: any) => w.phase === 'testen')
        .reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0);

      const totalActual = actualWerkvoorbereiding + actualProductie + actualTesten;
      const totalEstimated = parseFloat(distributor.expected_hours || '0');

      return {
        id: distributor.id,
        name: distributor.distributor_id || distributor.kast_naam,
        estimated: Math.round(totalEstimated * 10) / 10,
        actual: Math.round(totalActual * 10) / 10,
        werkvoorbereiding: Math.round(actualWerkvoorbereiding * 10) / 10,
        productie: Math.round(actualProductie * 10) / 10,
        testen: Math.round(actualTesten * 10) / 10,
        variance: Math.round((totalActual - totalEstimated) * 10) / 10,
        variancePercentage: totalEstimated > 0
          ? Math.round(((totalActual - totalEstimated) / totalEstimated) * 100)
          : 0
      };
    }).filter((v: any) => v.actual > 0 || v.estimated > 0);

    // Sort by variance (show largest deviations first)
    verdelerStats.sort((a: any, b: any) => Math.abs(b.variance) - Math.abs(a.variance));

    setEstimatedVsActualData(verdelerStats.slice(0, 15)); // Show top 15
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

    // Calculate hours KPIs
    const totalHours = workEntries.reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0);
    const hoursThisMonth = workEntries
      .filter((w: any) => new Date(w.date) >= thisMonthStart)
      .reduce((sum: number, w: any) => sum + (parseFloat(w.hours) || 0), 0);

    const activeEmployees = new Set(workEntries.map((w: any) => w.worker_id)).size;
    const avgHoursPerProject = projects.length > 0 ? totalHours / projects.length : 0;

    setKpiData({
      totalProjects: projects.length,
      totalClients: clients.length,
      totalDistributors: distributors.length,
      completedProjects: completedCount,
      activeProjects: activeCount,
      projectsThisMonth,
      distributorsThisMonth,
      clientsThisMonth,
      totalHours: Math.round(totalHours * 10) / 10,
      totalHoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
      avgHoursPerProject: Math.round(avgHoursPerProject * 10) / 10,
      activeEmployees,
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

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      const addHeader = async () => {
        pdf.setFillColor(30, 37, 48);
        pdf.rect(0, 0, pageWidth, 40, 'F');

        try {
          const logoImg = document.querySelector('img[alt="EWP Logo"]') as HTMLImageElement;
          if (logoImg && logoImg.complete && logoImg.naturalHeight !== 0) {
            await new Promise((resolve) => {
              if (logoImg.complete) {
                resolve(null);
              } else {
                logoImg.onload = () => resolve(null);
                logoImg.onerror = () => resolve(null);
              }
            });

            const canvas = document.createElement('canvas');
            canvas.width = logoImg.naturalWidth;
            canvas.height = logoImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(logoImg, 0, 0);
              const imgData = canvas.toDataURL('image/png');

              const logoHeight = 20;
              const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
              const logoWidth = logoHeight * aspectRatio;

              pdf.addImage(imgData, 'PNG', margin, 10, logoWidth, logoHeight);
            }
          }
        } catch (error) {
          console.log('Could not add logo:', error);
        }

        pdf.setFontSize(20);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Business Inzichten Rapport', margin + 50, 18);

        pdf.setFontSize(9);
        pdf.setTextColor(156, 163, 175);
        pdf.setFont('helvetica', 'normal');
        const dateInfo = `Periode: ${format(parseISO(startDate), 'dd MMM yyyy', { locale: nl })} - ${format(parseISO(endDate), 'dd MMM yyyy', { locale: nl })}`;
        pdf.text(dateInfo, margin + 50, 25);

        const clientInfo = selectedClient === 'all' ? 'Alle klanten' : `Klant: ${selectedClient}`;
        pdf.text(clientInfo, margin + 50, 30);
      };

      const addFooter = () => {
        pdf.setDrawColor(55, 65, 81);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        pdf.setFontSize(7);
        pdf.setTextColor(107, 114, 128);
        pdf.text(
          `© ${new Date().getFullYear()} Process Improvement B.V. - EWP Paneelbouw`,
          margin,
          pageHeight - 8
        );

        pdf.setTextColor(107, 114, 128);
        const genDate = `Gegenereerd: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: nl })}`;
        pdf.text(genDate, pageWidth - margin - pdf.getTextWidth(genDate), pageHeight - 8);
      };

      const addNewPage = async () => {
        pdf.addPage();
        await addHeader();
        return 50;
      };

      await addHeader();
      let yPos = 50;

      pdf.setFillColor(42, 48, 60);
      pdf.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');

      const kpiBoxes = [
        { label: 'Totale Uren', value: `${kpiData.totalHours}u`, color: [59, 130, 246] },
        { label: 'Actieve Projecten', value: kpiData.activeProjects.toString(), color: [16, 185, 129] },
        { label: 'Actieve Medewerkers', value: kpiData.activeEmployees.toString(), color: [245, 158, 11] },
        { label: 'Gem. Uren/Project', value: `${kpiData.avgHoursPerProject}u`, color: [139, 92, 246] }
      ];

      const boxWidth = (contentWidth - 15) / 4;

      kpiBoxes.forEach((kpi, index) => {
        const x = margin + 5 + (index * (boxWidth + 5));

        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.setFont('helvetica', 'normal');
        pdf.text(kpi.label, x, yPos + 10);

        pdf.setFontSize(16);
        pdf.setTextColor(...kpi.color);
        pdf.setFont('helvetica', 'bold');
        pdf.text(kpi.value, x, yPos + 22);
      });

      yPos += 45;

      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Prestatie Overzicht', margin, yPos);
      yPos += 8;

      pdf.setFillColor(42, 48, 60);
      pdf.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'F');

      const performanceMetrics = [
        { label: 'Totale Projecten', value: kpiData.totalProjects },
        { label: 'Afgeronde Projecten', value: kpiData.completedProjects },
        { label: 'Totale Verdelers', value: kpiData.totalDistributors },
        { label: 'Totale Klanten', value: kpiData.totalClients },
        { label: 'Projecten deze maand', value: kpiData.projectsThisMonth },
        { label: 'Uren deze maand', value: kpiData.totalHoursThisMonth }
      ];

      const metricsPerRow = 3;
      const metricWidth = contentWidth / metricsPerRow;

      performanceMetrics.forEach((metric, index) => {
        const row = Math.floor(index / metricsPerRow);
        const col = index % metricsPerRow;
        const x = margin + (col * metricWidth) + 5;
        const y = yPos + (row * 16) + 8;

        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.setFont('helvetica', 'normal');
        pdf.text(metric.label, x, y);

        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text(metric.value.toString(), x, y + 6);
      });

      yPos += 42;

      const chartElements = document.querySelectorAll('.recharts-wrapper');
      const chartTitles = [
        'Maandelijkse Trends',
        'Project Status Verdeling',
        'Maandelijkse Activiteit',
        'Uren Tracking',
        'Medewerker Productiviteit',
        'Verdeling per Fase',
        'Gemiddelde Uren per Fase',
        'Voorcalculatorische vs Werkelijke Uren'
      ];

      for (let i = 0; i < Math.min(chartElements.length, chartTitles.length); i++) {
        const element = chartElements[i] as HTMLElement;

        if (yPos > pageHeight - 100) {
          yPos = await addNewPage();
        }

        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text(chartTitles[i] || `Grafiek ${i + 1}`, margin, yPos);
        yPos += 5;

        try {
          const canvas = await html2canvas(element, {
            backgroundColor: '#1E2530',
            scale: 2,
            logging: false,
            useCORS: true
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPos + imgHeight > pageHeight - 20) {
            yPos = await addNewPage();
          }

          pdf.setFillColor(42, 48, 60);
          pdf.roundedRect(margin, yPos, contentWidth, imgHeight + 4, 2, 2, 'F');
          pdf.addImage(imgData, 'PNG', margin + 2, yPos + 2, imgWidth - 4, imgHeight);
          yPos += imgHeight + 12;
        } catch (error) {
          console.error('Error capturing chart:', error);
          yPos += 5;
        }
      }

      if (yPos > pageHeight - 80) {
        yPos = await addNewPage();
      }

      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Uren Analyse per Fase', margin, yPos);
      yPos += 8;

      if (phaseData.length > 0) {
        pdf.setFillColor(42, 48, 60);
        pdf.roundedRect(margin, yPos, contentWidth, 8 + (phaseData.length * 10), 2, 2, 'F');

        const colors: { [key: string]: [number, number, number] } = {
          'Werkvoorbereiding': [245, 158, 11],
          'Productie': [59, 130, 246],
          'Testen': [16, 185, 129],
          'Overig': [107, 114, 128]
        };

        phaseData.forEach((phase, index) => {
          const y = yPos + 6 + (index * 10);
          const phaseColor = colors[phase.name] || [107, 114, 128];

          pdf.setFillColor(...phaseColor);
          pdf.circle(margin + 5, y - 1, 1.5, 'F');

          pdf.setFontSize(9);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'normal');
          pdf.text(phase.name, margin + 10, y);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...phaseColor);
          pdf.text(`${phase.hours}u`, margin + 60, y);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(156, 163, 175);
          pdf.text(`(${phase.count} entries, gem. ${phase.avgHours}u)`, margin + 80, y);
        });

        yPos += 13 + (phaseData.length * 10);
      }

      if (yPos > pageHeight - 70) {
        yPos = await addNewPage();
      }

      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top 10 Verdelers - Geschatte vs Werkelijke Uren', margin, yPos);
      yPos += 6;

      if (estimatedVsActualData.length > 0) {
        const avgVariance = estimatedVsActualData.reduce((sum, v) => sum + Math.abs(v.variance), 0) / estimatedVsActualData.length;

        pdf.setFillColor(42, 48, 60);
        pdf.roundedRect(margin, yPos - 2, contentWidth, 8, 2, 2, 'F');

        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Gem. afwijking: ${Math.round(avgVariance * 10) / 10}u`, margin + 3, yPos + 3);
        yPos += 9;

        pdf.setFillColor(42, 48, 60);
        pdf.roundedRect(margin, yPos, contentWidth, 8, 2, 2, 'F');

        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Verdeler', margin + 2, yPos + 5);
        pdf.text('Geschat', margin + 75, yPos + 5);
        pdf.text('Werkelijk', margin + 100, yPos + 5);
        pdf.text('Afwijking', margin + 130, yPos + 5);
        pdf.text('%', margin + 160, yPos + 5);

        yPos += 10;

        for (let index = 0; index < Math.min(estimatedVsActualData.length, 10); index++) {
          const item = estimatedVsActualData[index];
          if (yPos > pageHeight - 25) {
            yPos = await addNewPage();
          }

          if (index % 2 === 0) {
            pdf.setFillColor(42, 48, 60);
            pdf.rect(margin, yPos - 4, contentWidth, 7, 'F');
          }

          pdf.setFontSize(7);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'normal');

          const nameText = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
          pdf.text(nameText, margin + 2, yPos);
          pdf.text(`${item.estimated}u`, margin + 75, yPos);
          pdf.text(`${item.actual}u`, margin + 100, yPos);

          const varianceColor: [number, number, number] = item.variance > 0 ? [239, 68, 68] : [16, 185, 129];
          pdf.setTextColor(...varianceColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${item.variance > 0 ? '+' : ''}${item.variance}u`, margin + 130, yPos);
          pdf.text(`${item.variancePercentage > 0 ? '+' : ''}${item.variancePercentage}%`, margin + 160, yPos);

          yPos += 7;
        }

        yPos += 5;
      }

      if (yPos > pageHeight - 60) {
        yPos = await addNewPage();
      }

      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top 10 Medewerkers', margin, yPos);
      yPos += 6;

      if (employeeData.length > 0) {
        pdf.setFillColor(42, 48, 60);
        pdf.roundedRect(margin, yPos, contentWidth, 8, 2, 2, 'F');

        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Naam', margin + 2, yPos + 5);
        pdf.text('Totale Uren', margin + 90, yPos + 5);
        pdf.text('Entries', margin + 125, yPos + 5);
        pdf.text('Verdelers', margin + 155, yPos + 5);

        yPos += 10;

        for (let index = 0; index < Math.min(employeeData.length, 10); index++) {
          const emp = employeeData[index];
          if (yPos > pageHeight - 25) {
            yPos = await addNewPage();
          }

          if (index % 2 === 0) {
            pdf.setFillColor(42, 48, 60);
            pdf.rect(margin, yPos - 4, contentWidth, 7, 'F');
          }

          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'normal');
          pdf.text(emp.name, margin + 2, yPos);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(16, 185, 129);
          pdf.text(`${emp.hours}u`, margin + 90, yPos);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(255, 255, 255);
          pdf.text(emp.entries.toString(), margin + 125, yPos);
          pdf.text(emp.verdelers.toString(), margin + 155, yPos);

          yPos += 7;
        }
      }

      for (let i = 1; i <= pdf.getNumberOfPages(); i++) {
        pdf.setPage(i);
        addFooter();
      }

      const clientSuffix = selectedClient !== 'all' ? `_${selectedClient.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `EWP_Inzichten_${format(parseISO(startDate), 'yyyyMMdd')}_${format(parseISO(endDate), 'yyyyMMdd')}${clientSuffix}.pdf`;
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
      {/* Hidden logo for PDF generation */}
      <img src={ewpLogo} alt="EWP Logo" className="hidden" crossOrigin="anonymous" />

      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📊 EWP Inzichten</h1>
            <p className="text-gray-400">Krijg inzicht in je bedrijfsprestaties en trends</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked!');
                generatePDFReport().catch(err => {
                  console.error('PDF generation failed:', err);
                  toast.error('Er is een fout opgetreden');
                });
              }}
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
            title: 'Totale Uren',
            value: kpiData.totalHours,
            change: kpiData.totalHoursThisMonth,
            changeLabel: 'deze maand',
            icon: Activity,
            color: 'blue',
            gradient: 'from-blue-500 to-blue-600',
            suffix: 'u'
          },
          {
            title: 'Actieve Medewerkers',
            value: kpiData.activeEmployees,
            change: Math.round((kpiData.activeEmployees / Math.max(kpiData.activeEmployees, 1)) * 100),
            changeLabel: 'werkzaam',
            icon: Users,
            color: 'green',
            gradient: 'from-green-500 to-green-600'
          },
          {
            title: 'Gem. Uren/Project',
            value: kpiData.avgHoursPerProject,
            change: kpiData.totalProjects,
            changeLabel: 'projecten',
            icon: Target,
            color: 'purple',
            gradient: 'from-purple-500 to-purple-600',
            suffix: 'u'
          },
          {
            title: 'Actieve Projecten',
            value: kpiData.activeProjects,
            change: Math.round((kpiData.activeProjects / Math.max(kpiData.totalProjects, 1)) * 100),
            changeLabel: 'van totaal',
            icon: Building,
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
                  <p className="text-3xl font-bold text-white">{kpi.value}{kpi.suffix || ''}</p>
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

        {/* Hours Tracking */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Activity size={20} className="text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold">Uren Tracking</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hoursData}>
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
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#06B6D4"
                strokeWidth={3}
                name="Totale Uren"
                dot={{ fill: '#06B6D4', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="avgHours"
                stroke="#8B5CF6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Gem. Uren/Werker"
                dot={{ fill: '#8B5CF6', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Productivity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Users size={20} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold">Medewerker Productiviteit</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E2530',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="hours" fill="#10B981" name="Totale Uren" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Project vs Hours Comparison */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Target size={20} className="text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Projecten vs Uren</h2>
                <p className="text-xs text-gray-400">Vergelijking van nieuwe projecten en gewerkte uren per maand</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="monthShort"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ value: 'Projecten', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ value: 'Uren', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E2530',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="projects" fill="#3B82F6" name="Nieuwe Projecten" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="hours" fill="#06B6D4" name="Gewerkte Uren" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <TrendingUp size={20} className="text-yellow-400" />
              </div>
              <h2 className="text-lg font-semibold">Top Performers</h2>
            </div>
          </div>
          <div className="space-y-4">
            {employeeData.slice(0, 5).map((emp, index) => (
              <div key={index} className="bg-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-white font-medium">{emp.name}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{emp.hours}u</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{emp.entries} werk entries</span>
                  <span>{emp.verdelers} verdelers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase Tracking Section */}
      <div className="mb-8">
        <div className="card p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">⏱️ Uren Analyse per Fase</h2>
          <p className="text-gray-400">Inzicht in tijdsbesteding per fase om voorcalculatorische uren te optimaliseren</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Phase Distribution Pie Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <PieChartIcon size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Verdeling per Fase</h2>
                  <p className="text-xs text-gray-400">Totale uren per werkfase</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={phaseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, hours }) => `${name}: ${hours}u`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {phaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'Werkvoorbereiding' ? '#F59E0B' :
                      entry.name === 'Productie' ? '#3B82F6' :
                      entry.name === 'Testen' ? '#10B981' : '#6B7280'
                    } />
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
            <div className="mt-4 space-y-2">
              {phaseData.map((phase, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full`} style={{
                      backgroundColor: phase.name === 'Werkvoorbereiding' ? '#F59E0B' :
                                     phase.name === 'Productie' ? '#3B82F6' :
                                     phase.name === 'Testen' ? '#10B981' : '#6B7280'
                    }}></div>
                    <span className="text-gray-300">{phase.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-white font-semibold">{phase.hours}u</span>
                    <span className="text-gray-400">({phase.count} entries)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Average Hours per Phase */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart3 size={20} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Gemiddelde Uren per Fase</h2>
                  <p className="text-xs text-gray-400">Gemiddelde tijdsbesteding per entry</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={phaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  label={{ value: 'Gemiddelde Uren', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E2530',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="avgHours" fill="#8B5CF6" name="Gem. Uren" radius={[4, 4, 0, 0]}>
                  {phaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'Werkvoorbereiding' ? '#F59E0B' :
                      entry.name === 'Productie' ? '#3B82F6' :
                      entry.name === 'Testen' ? '#10B981' : '#6B7280'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estimated vs Actual Hours */}
        <div className="grid grid-cols-1 gap-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Target size={20} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Voorcalculatorische vs Werkelijke Uren</h2>
                  <p className="text-xs text-gray-400">Top 15 verdelers met grootste afwijkingen - optimaliseer je schattingen</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={estimatedVsActualData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E2530',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1E2530] p-4 rounded-lg border border-gray-700">
                          <p className="font-semibold text-white mb-2">{data.name}</p>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-blue-400">Geschat:</span> <span className="text-white font-semibold">{data.estimated}u</span></p>
                            <p><span className="text-green-400">Werkelijk:</span> <span className="text-white font-semibold">{data.actual}u</span></p>
                            <p><span className="text-orange-400">Werkvoorbereiding:</span> {data.werkvoorbereiding}u</p>
                            <p><span className="text-blue-400">Productie:</span> {data.productie}u</p>
                            <p><span className="text-cyan-400">Testen:</span> {data.testen}u</p>
                            <p className="pt-2 border-t border-gray-700">
                              <span className={data.variance > 0 ? 'text-red-400' : 'text-green-400'}>
                                Afwijking: {data.variance > 0 ? '+' : ''}{data.variance}u ({data.variancePercentage > 0 ? '+' : ''}{data.variancePercentage}%)
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="estimated" fill="#3B82F6" name="Voorcalculatorisch" radius={[0, 4, 4, 0]} />
                <Bar dataKey="actual" fill="#10B981" name="Werkelijk" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-500/10 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Gemiddelde Afwijking</div>
                <div className="text-2xl font-bold text-white">
                  {estimatedVsActualData.length > 0
                    ? Math.round((estimatedVsActualData.reduce((sum, v) => sum + Math.abs(v.variance), 0) / estimatedVsActualData.length) * 10) / 10
                    : 0}u
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Onder Schatting</div>
                <div className="text-2xl font-bold text-green-400">
                  {estimatedVsActualData.filter(v => v.variance > 0).length}
                </div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Over Schatting</div>
                <div className="text-2xl font-bold text-red-400">
                  {estimatedVsActualData.filter(v => v.variance < 0).length}
                </div>
              </div>
            </div>
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