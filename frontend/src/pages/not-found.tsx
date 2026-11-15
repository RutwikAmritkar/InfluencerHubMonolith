import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF9F6] p-4 text-[#0A0A0A]">
      <Card className="w-full max-w-md shadow-xs border-[#E5E4DF] bg-white rounded-xl overflow-hidden">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-[#FAF9F6] text-[#0A0A0A] border border-[#E5E4DF] rounded-xl flex items-center justify-center shadow-xs">
            <AlertCircle className="h-8 w-8 text-[#52525B]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#0A0A0A]">
              Page <span className="font-serif italic font-normal">Not Found</span>
            </h1>
            <p className="text-xs text-[#52525B] mt-1.5 max-w-xs mx-auto">
              The requested resource has been relocated or does not exist in the active ledger.
            </p>
          </div>
          <div className="pt-2 w-full">
            <Link href="/">
              <Button className="w-full h-10 bg-[#0A0A0A] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Workspace</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
