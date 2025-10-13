import { LoginForm } from "@/components/login-form";
import { HardHat } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary p-3">
            <HardHat className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
            UltraTech SieveLab
          </h1>
          <p className="mt-2 text-muted-foreground">
            Analyze your aggregate data with precision.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
