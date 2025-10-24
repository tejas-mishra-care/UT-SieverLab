
import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-20 w-20">
            <Image src="/UT.jpeg" alt="UT Logo" width={80} height={80} className="rounded-full" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
            UltraTech Sieve Test Master
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
