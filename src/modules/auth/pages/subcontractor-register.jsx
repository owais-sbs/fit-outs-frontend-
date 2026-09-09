import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, ChevronRight, Upload, X, Shield, Building2, User, FileText, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarBrand } from "@/components/brand/BrandMark";
import { TRADE_SPECIALIZATIONS_LIST, saveNewRegistration } from "@/modules/subcontractor/mock/subcontractorOnboardingMock";

const REQUIRED_DOC_TYPES = [
  { type: "Commercial Registration", required: true, hint: "Valid CR document from Department of Economy / Municipality" },
  { type: "Trade License", required: true, hint: "Active trade license covering applied specializations" },
  { type: "VAT Certificate", required: false, hint: "Tax Registration Number (TRN) certificate if registered" },
  { type: "Company Profile", required: false, hint: "Company brochure, portfolio, or capability statement" },
  { type: "Insurance Certificate", required: false, hint: "Workmen Compensation or Public Liability policy" },
  { type: "Other Compliance Document", required: false, hint: "ISO, HSE, or ASTA certificates" },
];

export default function SubcontractorRegistrationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Form State
  const [companyInfo, setCompanyInfo] = useState({
    legalName: "",
    tradeName: "",
    crNumber: "",
    vatId: "",
    officeAddress: "",
    contactEmail: "",
    contactPhone: "",
    tradeSpecializations: [],
  });

  const [adminInfo, setAdminInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [documents, setDocuments] = useState([]);
  const [confirmed, setConfirmed] = useState(false);

  // Toggle Trade Specialization
  const toggleTrade = (trade) => {
    setCompanyInfo((prev) => {
      const exists = prev.tradeSpecializations.includes(trade);
      const updated = exists
        ? prev.tradeSpecializations.filter((t) => t !== trade)
        : [...prev.tradeSpecializations, trade];
      return { ...prev, tradeSpecializations: updated };
    });
    if (errors.tradeSpecializations) {
      setErrors((prev) => ({ ...prev, tradeSpecializations: null }));
    }
  };

  // Handle Document Upload
  const handleDocUpload = (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [`doc_${type}`]: "File size exceeds 10MB limit." }));
      return;
    }

    const existingIndex = documents.findIndex((d) => d.type === type);
    const newDoc = {
      type,
      filename: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "Uploaded",
    };

    if (existingIndex >= 0) {
      const updated = [...documents];
      updated[existingIndex] = newDoc;
      setDocuments(updated);
    } else {
      setDocuments([...documents, newDoc]);
    }

    setErrors((prev) => ({ ...prev, [`doc_${type}`]: null, documents: null }));
    e.target.value = "";
  };

  const removeDoc = (type) => {
    setDocuments(documents.filter((d) => d.type !== type));
  };

  // Step Validations
  const validateStep1 = () => {
    const errs = {};
    if (!companyInfo.legalName.trim()) errs.legalName = "Legal Company Name is required.";
    if (!companyInfo.crNumber.trim()) errs.crNumber = "Commercial Registration Number is required.";
    if (!companyInfo.officeAddress.trim()) errs.officeAddress = "Office Address is required.";
    if (!companyInfo.contactEmail.trim()) errs.contactEmail = "Contact Email is required.";
    else if (!/\S+@\S+\.\S+/.test(companyInfo.contactEmail)) errs.contactEmail = "Invalid email format.";
    if (!companyInfo.contactPhone.trim()) errs.contactPhone = "Contact Phone is required.";
    if (companyInfo.tradeSpecializations.length === 0) errs.tradeSpecializations = "Please select at least one trade specialization.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!adminInfo.fullName.trim()) errs.fullName = "Full Name is required.";
    if (!adminInfo.email.trim()) errs.email = "Admin Email is required.";
    else if (!/\S+@\S+\.\S+/.test(adminInfo.email)) errs.email = "Invalid email format.";
    if (!adminInfo.phone.trim()) errs.phone = "Phone number is required.";
    if (!adminInfo.password) errs.password = "Password is required.";
    else if (adminInfo.password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (adminInfo.password !== adminInfo.confirmPassword) errs.confirmPassword = "Passwords do not match.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    const missingRequired = REQUIRED_DOC_TYPES.filter((rd) => rd.required).filter(
      (rd) => !documents.some((d) => d.type === rd.type)
    );
    if (missingRequired.length > 0) {
      errs.documents = `Please upload all required compliance documents (${missingRequired.map((m) => m.type).join(", ")}).`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!confirmed) {
      setErrors((prev) => ({ ...prev, confirmed: "You must confirm that the information provided is accurate." }));
      return;
    }

    // Save to mock database
    saveNewRegistration({
      company: companyInfo,
      admin: adminInfo,
      documents: documents,
    });

    // Navigate to status page
    navigate("/subcontractor/onboarding-status");
  };

  const STEPS = [
    { num: 1, label: "Company Information", icon: Building2 },
    { num: 2, label: "Primary Admin", icon: User },
    { num: 3, label: "Compliance Documents", icon: FileText },
    { num: 4, label: "Review & Submit", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Top Header / Branding */}
      <div className="mx-auto w-full max-w-5xl flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <SidebarBrand portal="Subcontractor Network" />
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Already registered?</span>{" "}
          <Link to="/login" className="text-xs font-semibold text-primary hover:underline">
            Sign In to Portal
          </Link>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <main className="mx-auto w-full max-w-4xl py-8">
        <div className="text-center mb-8">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">Vendor Prequalification</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white">Subcontractor Registration</h1>
          <p className="mt-2 text-sm text-slate-400">Join JCT Contracting's verified trade vendor network to receive tenders & RFQs.</p>
        </div>

        {/* Stepper Header */}
        <div className="mb-8 grid grid-cols-4 gap-2 border border-slate-800 bg-slate-950/60 p-3 rounded-xl">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <div
                key={step.num}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : isCompleted
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.num}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-medium truncate">{step.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form Body Card */}
        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur shadow-2xl">
          <CardContent className="p-6 md:p-8">
            {/* STEP 1: COMPANY INFORMATION */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Step 1: Company Profile & Specializations
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Provide your legal company details as stated on your Trade License.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Legal Company Name *</Label>
                    <Input
                      placeholder="e.g. Apex Electrical Contracting LLC"
                      value={companyInfo.legalName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, legalName: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.legalName && <p className="text-[11px] text-rose-400">{errors.legalName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Trade / Operating Name</Label>
                    <Input
                      placeholder="e.g. Apex Electrical"
                      value={companyInfo.tradeName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, tradeName: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Commercial Registration (CR) Number *</Label>
                    <Input
                      placeholder="e.g. CR-987654-DXB"
                      value={companyInfo.crNumber}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, crNumber: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.crNumber && <p className="text-[11px] text-rose-400">{errors.crNumber}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">VAT / Tax Registration Number (TRN)</Label>
                    <Input
                      placeholder="e.g. 100293847500003"
                      value={companyInfo.vatId}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, vatId: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Contact Email *</Label>
                    <Input
                      type="email"
                      placeholder="info@company.com"
                      value={companyInfo.contactEmail}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, contactEmail: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.contactEmail && <p className="text-[11px] text-rose-400">{errors.contactEmail}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Contact Phone *</Label>
                    <Input
                      placeholder="+971 4 000 0000"
                      value={companyInfo.contactPhone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, contactPhone: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.contactPhone && <p className="text-[11px] text-rose-400">{errors.contactPhone}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-200">Office / Headquarters Address *</Label>
                  <Textarea
                    placeholder="Street, Building, Plot Number, City, Emirate / Region"
                    value={companyInfo.officeAddress}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, officeAddress: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 h-20"
                  />
                  {errors.officeAddress && <p className="text-[11px] text-rose-400">{errors.officeAddress}</p>}
                </div>

                {/* Trade Specializations */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <Label className="text-xs font-medium text-slate-200">Trade Specializations (Select all that apply) *</Label>
                  <p className="text-[11px] text-slate-400 mb-2">Select the construction trades your firm is licensed and equipped to execute.</p>
                  <div className="flex flex-wrap gap-2">
                    {TRADE_SPECIALIZATIONS_LIST.map((trade) => {
                      const isSelected = companyInfo.tradeSpecializations.includes(trade);
                      return (
                        <button
                          key={trade}
                          type="button"
                          onClick={() => toggleTrade(trade)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          {trade}
                        </button>
                      );
                    })}
                  </div>
                  {errors.tradeSpecializations && (
                    <p className="text-[11px] text-rose-400">{errors.tradeSpecializations}</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: PRIMARY ADMIN */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Step 2: Primary Subcontractor Admin Account
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    This user will become your firm's primary Subcontractor Administrator on the JCT platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-medium text-slate-200">Full Name *</Label>
                    <Input
                      placeholder="e.g. Rashid Mansoor"
                      value={adminInfo.fullName}
                      onChange={(e) => setAdminInfo({ ...adminInfo, fullName: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.fullName && <p className="text-[11px] text-rose-400">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Admin Email Address (User ID) *</Label>
                    <Input
                      type="email"
                      placeholder="admin@company.com"
                      value={adminInfo.email}
                      onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.email && <p className="text-[11px] text-rose-400">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Mobile Phone Number *</Label>
                    <Input
                      placeholder="+971 50 123 4567"
                      value={adminInfo.phone}
                      onChange={(e) => setAdminInfo({ ...adminInfo, phone: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.phone && <p className="text-[11px] text-rose-400">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Password *</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={adminInfo.password}
                      onChange={(e) => setAdminInfo({ ...adminInfo, password: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.password && <p className="text-[11px] text-rose-400">{errors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-200">Confirm Password *</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={adminInfo.confirmPassword}
                      onChange={(e) => setAdminInfo({ ...adminInfo, confirmPassword: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.confirmPassword && <p className="text-[11px] text-rose-400">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: COMPLIANCE DOCUMENTS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Step 3: Compliance & Legal Document Upload
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload official corporate documents for JCT prequalification verification (Max 10MB per file; PDF/PNG/JPG/DOCX).
                  </p>
                </div>

                {errors.documents && (
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                    {errors.documents}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {REQUIRED_DOC_TYPES.map((docType) => {
                    const uploaded = documents.find((d) => d.type === docType.type);
                    const errorMsg = errors[`doc_${docType.type}`];

                    return (
                      <div
                        key={docType.type}
                        className={`p-4 rounded-xl border transition-all ${
                          uploaded
                            ? "bg-slate-900/90 border-emerald-500/40"
                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{docType.type}</span>
                              {docType.required ? (
                                <Badge className="bg-rose-500/15 text-rose-400 border-none text-[10px]">Required</Badge>
                              ) : (
                                <Badge className="bg-slate-700/40 text-slate-400 border-none text-[10px]">Optional</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{docType.hint}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {uploaded ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs py-1 px-2.5 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> {uploaded.filename}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                  onClick={() => removeDoc(docType.type)}
                                >
                                  <X className="h-3.5 w-3.5" /> Remove
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-xs font-medium transition-all">
                                <Upload className="h-3.5 w-3.5" /> Upload File
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                  className="hidden"
                                  onChange={(e) => handleDocUpload(docType.type, e)}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                        {errorMsg && <p className="mt-2 text-xs text-rose-400">{errorMsg}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Step 4: Review & Submit Application
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Confirm all entered details before sending to JCT Procurement for verification.</p>
                </div>

                {/* Section 1: Company Profile */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Company Profile</span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="h-7 text-xs text-primary">
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Legal Name</span>
                      <span className="text-white font-medium">{companyInfo.legalName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">CR Number</span>
                      <span className="text-white font-medium">{companyInfo.crNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">VAT ID</span>
                      <span className="text-white font-medium">{companyInfo.vatId || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email</span>
                      <span className="text-white font-medium">{companyInfo.contactEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone</span>
                      <span className="text-white font-medium">{companyInfo.contactPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Address</span>
                      <span className="text-white font-medium truncate">{companyInfo.officeAddress}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-400 text-xs block mb-1">Specializations</span>
                    <div className="flex flex-wrap gap-1">
                      {companyInfo.tradeSpecializations.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] bg-slate-800 text-slate-200">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2: Primary Admin */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Primary Admin User</span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="h-7 text-xs text-primary">
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Full Name</span>
                      <span className="text-white font-medium">{adminInfo.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email Address</span>
                      <span className="text-white font-medium">{adminInfo.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Mobile Phone</span>
                      <span className="text-white font-medium">{adminInfo.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Uploaded Documents */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Uploaded Documents ({documents.length})</span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="h-7 text-xs text-primary">
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.type} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-white font-medium">{doc.type}</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {doc.filename}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <Checkbox
                      id="confirm"
                      checked={confirmed}
                      onCheckedChange={(val) => {
                        setConfirmed(!!val);
                        if (errors.confirmed) setErrors((prev) => ({ ...prev, confirmed: null }));
                      }}
                      className="mt-0.5"
                    />
                    <label htmlFor="confirm" className="text-xs text-slate-300 cursor-pointer">
                      I confirm that the information and documents provided are accurate and complete. I authorize JCT Contracting to verify CR and trade registration licenses with local authorities. *
                    </label>
                  </div>
                  {errors.confirmed && <p className="text-[11px] text-rose-400">{errors.confirmed}</p>}
                </div>
              </div>
            )}

            {/* Stepper Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext} className="text-xs font-semibold">
                  Next Step <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6">
                  Submit Application <Check className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-800">
        © {new Date().getFullYear()} JCT Construction & Fit-Out Platform. All Rights Reserved.
      </footer>
    </div>
  );
}
