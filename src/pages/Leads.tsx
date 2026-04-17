import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadsTable from '@/components/leads/LeadsTable';

const Leads = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Leads</h1>
          <p className="text-muted-foreground mt-1">All leads from Meta Ads and other sources.</p>
        </div>
        <LeadsTable />
      </div>
    </DashboardLayout>
  );
};

export default Leads;

