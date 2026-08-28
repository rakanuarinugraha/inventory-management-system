import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <main className="flex flex-col items-center gap-6 text-center max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">
          Inventory Management System
        </h1>
        <p className="text-muted-foreground text-lg">
          Track stock, manage warehouses, and streamline operations.
        </p>
        <Button size="lg">Get Started</Button>
      </main>
    </div>
  );
}
