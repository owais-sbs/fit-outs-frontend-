import { createContext, useContext } from "react";
import usePmAwaitingApprovalCounts from "./usePmAwaitingApprovalCounts";

const PmAwaitingApprovalsContext = createContext(null);

export function PmAwaitingApprovalsProvider({ children }) {
  const value = usePmAwaitingApprovalCounts();
  return (
    <PmAwaitingApprovalsContext.Provider value={value}>
      {children}
    </PmAwaitingApprovalsContext.Provider>
  );
}

export function usePmAwaitingApprovals() {
  const shared = useContext(PmAwaitingApprovalsContext);
  if (!shared) {
    throw new Error("usePmAwaitingApprovals must be used within PmAwaitingApprovalsProvider");
  }
  return shared;
}
