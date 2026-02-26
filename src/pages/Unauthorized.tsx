import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
