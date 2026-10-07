import * as React from "react";
import { Footer } from "@/components/Footer";

type Props = {
  children: React.ReactNode;
};

export default function LayoutShell({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md md:max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
