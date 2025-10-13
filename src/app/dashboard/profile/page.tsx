import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="font-headline text-2xl font-bold">User Profile</h2>
          <p className="text-muted-foreground">
            View and manage your account settings.
          </p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Update your personal information here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
              <AvatarFallback>CE</AvatarFallback>
            </Avatar>
            <Button variant="outline">Change Photo</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Civil Engineer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="test@example.com" disabled />
            </div>
          </div>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <Button>Save Changes</Button>
             <Button variant="destructive" asChild>
                <Link href="/">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
