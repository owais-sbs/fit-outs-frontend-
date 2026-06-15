import React from "react";

export default function ConfigurationLayout({ children }) {
  return (
    <div className="flex flex-col gap-6 p-6 h-full w-full">
      {children}
    </div>
  );
}
