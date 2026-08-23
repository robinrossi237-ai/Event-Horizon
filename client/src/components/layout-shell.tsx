import * as React from "react";

type Props = {
  children: React.ReactNode;
};

export default function LayoutShell({ children }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md md:max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10">
        {children}
      </div>
    </div>
  );
}
