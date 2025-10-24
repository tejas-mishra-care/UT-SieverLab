
import { SignupForm } from "@/components/signup-form";
import Image from "next/image";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-20 w-20">
             <Image src="/UT.jpeg" alt="UT Logo" width={80} height={80} className="rounded-full" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
            Join UltraTech Sieve Test Master
          </h1>
          <p className="mt-2 text-muted-foreground">
            Start analyzing your aggregate data today.
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
