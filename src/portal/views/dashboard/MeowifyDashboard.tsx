import { Cat, QrCode, ShieldCheck } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';

const BREADCRUMBS = [
  { title: 'Dashboard', to: '/portal/dashboard' },
];

const MeowifyDashboard = () => {
  return (
    <>
      <BreadcrumbComp title="Meowify Dashboard" items={BREADCRUMBS} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card p-6 shadow-sm">
          <Cat className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Cat Profiles</h3>
          <p className="text-sm text-muted-foreground">Create and maintain all tagged cat records.</p>
        </div>
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card p-6 shadow-sm">
          <QrCode className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">QR Ready</h3>
          <p className="text-sm text-muted-foreground">Generate downloadable QR codes for each pet profile.</p>
        </div>
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card p-6 shadow-sm">
          <ShieldCheck className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Admin Only</h3>
          <p className="text-sm text-muted-foreground">Dashboard access is restricted to internal team members.</p>
        </div>
      </div>
    </>
  );
};

export default MeowifyDashboard;
