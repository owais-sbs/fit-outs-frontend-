import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchScPortalContext } from "@/modules/admin/api/subcontractor.api";

const restrictiveContext = {
  portalRole: null,
  portalUserStatus: null,
  canAccessCommercial: false,
  canAccessExecution: false,
  canAccessTendering: false,
  canAccessDocuments: false,
  isOrgAdmin: false,
  loaded: false,
};

const SubcontractorPortalContext = createContext(restrictiveContext);

function mapPortalContext(data) {
  if (!data) return restrictiveContext;
  return {
    portalRole: data.portalRole || null,
    portalUserStatus: data.portalUserStatus || null,
    canAccessCommercial: Boolean(data.canAccessCommercial),
    canAccessExecution: Boolean(data.canAccessExecution),
    canAccessTendering: Boolean(data.canAccessTendering),
    canAccessDocuments: Boolean(data.canAccessDocuments),
    isOrgAdmin: Boolean(data.isOrgAdmin ?? data.orgAdmin),
    loaded: true,
  };
}

export function SubcontractorPortalProvider({ children }) {
  const [ctx, setCtx] = useState(restrictiveContext);

  useEffect(() => {
    fetchScPortalContext()
      .then((data) => setCtx(mapPortalContext(data)))
      .catch(() => setCtx({ ...restrictiveContext, loaded: true }));
  }, []);

  const value = useMemo(() => ctx, [ctx]);
  return (
    <SubcontractorPortalContext.Provider value={value}>
      {children}
    </SubcontractorPortalContext.Provider>
  );
}

export function useSubcontractorPortal() {
  return useContext(SubcontractorPortalContext);
}
