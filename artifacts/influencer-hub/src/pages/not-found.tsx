import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-muted">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">404 - Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Button size="lg" className="rounded-full" asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
