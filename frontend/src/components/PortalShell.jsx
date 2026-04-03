import { useEffect, useMemo, useState } from "react";
import {
  createDonorRequest,
  createRecipientRequest,
  fetchBloodBanks,
  fetchBloodBankSummary,
  fetchDonations,
  fetchDonorEligibility,
  fetchDonorRequests,
  fetchInventory,
  fetchRecipientRequests,
  searchRecipientBanks,
  updateDonorRequestStatus,
  updateRecipientRequestStatus,
} from "../lib/api";
import { notifications } from "../data/mockData";

const statusTone = {
  Eligible: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "Cooling Period": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "Under Review": "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  Pending: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Accepted: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Approved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Completed: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  "Not Eligible": "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Emergency: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Recommended: "bg-brand-500/15 text-brand-200 ring-brand-400/30",
  Operational: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "Low Stock": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Healthy: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Low: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  Critical: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  Fit: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "Low Hemoglobin": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "Under Observation": "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  "Pending Bank Review": "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "Accepted by Blood Bank": "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Active: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Expired: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const rolePages = {
  donor: ["Dashboard", "My Profile", "My Donations", "My Requests"],
  recipient: ["Dashboard", "My Profile", "Search Blood", "My Requests", "My Transfers"],
  bloodBank: ["Dashboard", "My Bank", "Donor Requests", "Recipient Requests", "Inventory", "Donations", "Distributions"],
  admin: ["Dashboard", "Donor Requests", "Recipient Requests", "Inventory", "Donations", "Distributions"],
};

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const requestStatuses = ["All", "Pending", "Accepted", "Rejected", "Completed", "Emergency"];
const urgencyLevels = ["All", "Emergency", "High", "Medium", "Low"];

function PortalShell({ session, onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState({
    profile: session.user,
    eligibility: null,
    donations: [],
    donorRequests: [],
    recipientRequests: [],
    banks: [],
    bankCatalog: [],
    inventory: [],
    bankSummary: null,
  });

  const pages = rolePages[session.role];
  const totalUnits = useMemo(() => data.inventory.reduce((sum, item) => sum + Number(item.unitsAvailable || 0), 0), [data.inventory]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        if (session.role === "donor") {
          const [donationsResult, donorRequestsResult, eligibilityResult] = await Promise.all([
            fetchDonations({ donor: session.user.id }),
            fetchDonorRequests({ donor: session.user.id }),
            fetchDonorEligibility(session.user.id),
          ]);

          if (!cancelled) {
            setData((current) => ({
              ...current,
              donations: mapDonations(donationsResult.data),
              donorRequests: mapDonorRequests(donorRequestsResult.data),
              eligibility: eligibilityResult.data,
            }));
          }
        }

        if (session.role === "recipient") {
          const [recipientRequestsResult, bankSearchResult, bankListResult] = await Promise.all([
            fetchRecipientRequests({
              recipient: session.user.id,
              status: statusFilter,
              urgency: urgencyFilter,
              bloodGroup: bloodGroupFilter,
            }),
            searchRecipientBanks({
              bloodGroup: bloodGroupFilter === "All" ? session.user.bloodGroup : bloodGroupFilter,
            }),
            fetchBloodBanks(),
          ]);

          if (!cancelled) {
            setData((current) => ({
              ...current,
              recipientRequests: mapRecipientRequests(recipientRequestsResult.data),
              banks: mapRecommendedBanks(bankSearchResult.data),
              bankCatalog: mapBankOptions(bankListResult.data),
            }));
          }
        }

        if (session.role === "bloodBank") {
          const [bankSummaryResult, donorRequestsResult, recipientRequestsResult, donationsResult, inventoryResult] = await Promise.all([
            fetchBloodBankSummary(session.user.id),
            fetchDonorRequests({ bank: session.user.id, search }),
            fetchRecipientRequests({ bank: session.user.id, status: statusFilter, urgency: urgencyFilter, bloodGroup: bloodGroupFilter, search }),
            fetchDonations({ bank: session.user.id, search }),
            fetchInventory({ bank: session.user.id, bloodGroup: bloodGroupFilter }),
          ]);

          if (!cancelled) {
            setData((current) => ({
              ...current,
              bankSummary: bankSummaryResult.data,
              donorRequests: mapDonorRequests(donorRequestsResult.data),
              recipientRequests: mapRecipientRequests(recipientRequestsResult.data),
              donations: mapDonations(donationsResult.data),
              inventory: mapInventory(inventoryResult.data),
            }));
          }
        }

        if (session.role === "admin") {
          const [donorRequestsResult, recipientRequestsResult, donationsResult, inventoryResult] = await Promise.all([
            fetchDonorRequests({ search }),
            fetchRecipientRequests({ status: statusFilter, urgency: urgencyFilter, bloodGroup: bloodGroupFilter, search }),
            fetchDonations({ search }),
            fetchInventory({ bloodGroup: bloodGroupFilter }),
          ]);

          if (!cancelled) {
            setData((current) => ({
              ...current,
              bankSummary: { 
                name: "Super Admin", 
                pendingDonorRequests: donorRequestsResult.data.length, 
                pendingRecipientRequests: recipientRequestsResult.data.length, 
                totalDonations: donationsResult.data.length,
                availableUnits: inventoryResult.data.reduce((sum, item) => sum + Number(item.unitsAvailable || 0), 0)
              },
              donorRequests: mapDonorRequests(donorRequestsResult.data),
              recipientRequests: mapRecipientRequests(recipientRequestsResult.data),
              donations: mapDonations(donationsResult.data),
              inventory: mapInventory(inventoryResult.data),
            }));
          }
        }

        if (session.role !== "bloodBank" && session.role !== "admin") {
          const [inventoryResult, bankListResult] = await Promise.all([
            fetchInventory({ bloodGroup: bloodGroupFilter }),
            fetchBloodBanks(),
          ]);
          if (!cancelled) {
            setData((current) => ({
              ...current,
              inventory: mapInventory(inventoryResult.data),
              bankCatalog: mapBankOptions(bankListResult.data),
            }));
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [session, search, bloodGroupFilter, statusFilter, urgencyFilter, refreshKey]);

  async function handleRecipientRequest(payload) {
    try {
      setError("");
      setSuccess("");
      await createRecipientRequest(payload);
      setSuccess("Recipient request created successfully.");
      setActivePage("My Requests");
      setStatusFilter("All");
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || "Failed to create recipient request");
    }
  }

  async function handleDonorRequest(payload) {
    try {
      setError("");
      setSuccess("");
      await createDonorRequest(payload);
      setSuccess("Donor request created successfully.");
      setActivePage("My Requests");
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || "Failed to create donor request");
    }
  }

  async function handleRecipientStatusChange(requestCode, status) {
    try {
      setError("");
      setSuccess("");
      await updateRecipientRequestStatus(requestCode, status);
      setSuccess(`Recipient request ${requestCode} updated to ${status}.`);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || "Failed to update recipient request");
    }
  }

  async function handleDonorStatusChange(requestCode, status, payload = {}) {
    try {
      setError("");
      setSuccess("");
      await updateDonorRequestStatus(requestCode, status, payload.units);
      setSuccess(`Donor request ${requestCode} updated to ${status}.`);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || "Failed to update donor request");
    }
  }

  return (
    <div className="min-h-screen bg-mesh px-4 py-4 text-slate-100 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="glass rounded-[28px] border border-white/10 p-5 shadow-glow">
          <SidebarCard session={session} totalUnits={totalUnits} bankSummary={data.bankSummary} />
          <nav className="space-y-2">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                  activePage === page ? "bg-brand-600 text-white shadow-lg shadow-brand-950/40" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{page}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="glass scrollbar overflow-hidden rounded-[28px] border border-white/10 shadow-glow">
          <TopBar search={search} setSearch={setSearch} activePage={activePage} session={session} onLogout={onLogout} />
          <div className="scrollbar h-[calc(100vh-7rem)] overflow-y-auto p-4 md:p-6">
            {error ? <Alert type="error" message={error} /> : null}
            {success ? <Alert type="success" message={success} /> : null}
            {loading ? <LoadingState /> : renderPage({
              session,
              activePage,
              data,
              bloodGroupFilter,
              setBloodGroupFilter,
              statusFilter,
              setStatusFilter,
              urgencyFilter,
              setUrgencyFilter,
              onCreateRecipientRequest: handleRecipientRequest,
              onCreateDonorRequest: handleDonorRequest,
              onUpdateRecipientStatus: handleRecipientStatusChange,
              onUpdateDonorStatus: handleDonorStatusChange,
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

function renderPage({
  session,
  activePage,
  data,
  bloodGroupFilter,
  setBloodGroupFilter,
  statusFilter,
  setStatusFilter,
  urgencyFilter,
  setUrgencyFilter,
  onCreateRecipientRequest,
  onCreateDonorRequest,
  onUpdateRecipientStatus,
  onUpdateDonorStatus,
}) {
  if (session.role === "donor") {
    if (activePage === "Dashboard") return <DonorDashboard user={session.user} eligibility={data.eligibility} donations={data.donations} donorRequests={data.donorRequests} />;
    if (activePage === "My Profile") return <ProfilePage profile={session.user} extra={data.eligibility?.reason} statusOverride={data.eligibility?.eligibility} />;
    if (activePage === "My Donations") return <DataPanel title="My Donations" rows={data.donations} columns={["id", "donor", "bank", "bloodGroup", "units", "status"]} />;
    return <DonorRequestTab user={session.user} rows={data.donorRequests} bankOptions={data.bankCatalog} onSubmit={onCreateDonorRequest} />;
  }

  if (session.role === "recipient") {
    if (activePage === "Dashboard") return <RecipientDashboard user={session.user} requests={data.recipientRequests} />;
    if (activePage === "My Profile") return <ProfilePage profile={session.user} />;
    if (activePage === "Search Blood") {
      return (
        <RecipientSearchPage
          user={session.user}
          banks={data.banks}
          bloodGroupFilter={bloodGroupFilter}
          setBloodGroupFilter={setBloodGroupFilter}
        />
      );
    }
    return <RecipientOwnRequestsTab user={session.user} rows={data.recipientRequests} bankOptions={data.bankCatalog} onSubmit={onCreateRecipientRequest} />;
  }

  if (activePage === "Dashboard") return <BloodBankDashboard summary={data.bankSummary} donorRequests={data.donorRequests} recipientRequests={data.recipientRequests} />;
  if (activePage === "My Bank") return <ProfilePage profile={session.user} extra={data.bankSummary ? `Pending donor requests: ${data.bankSummary.pendingDonorRequests}` : ""} />;
  if (activePage === "Donor Requests") {
    return (
      <ManagedRequestTable
        title="Donor Requests"
        subtitle="Review donor requests and update their status in the database."
        rows={data.donorRequests}
        columns={["id", "donorName", "bank", "bloodGroup", "preferredDate", "status"]}
        actions={[
          { label: "Accept", status: "Accepted by Blood Bank" },
          { label: "Reject", status: "Rejected", tone: "danger" },
          { label: "Complete", status: "Completed", tone: "neutral" },
        ]}
        onStatusChange={onUpdateDonorStatus}
      />
    );
  }
  if (activePage === "Recipient Requests") {
    return (
      <ManagedRequestTable
        title="Recipient Requests"
        subtitle="Review recipient requests and update workflow statuses from the blood bank portal."
        rows={data.recipientRequests}
        columns={["id", "recipient", "bank", "bloodGroup", "urgency", "status"]}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        urgencyFilter={urgencyFilter}
        setUrgencyFilter={setUrgencyFilter}
        bloodGroupFilter={bloodGroupFilter}
        setBloodGroupFilter={setBloodGroupFilter}
        actions={[
          { label: "Accept", status: "Processed by Bank" },
          { label: "Reject", status: "Rejected", tone: "danger" },
          { label: "Transferred", status: "Completed", tone: "neutral" },
        ]}
        onStatusChange={onUpdateRecipientStatus}
      />
    );
  }

  if (activePage === "Distributions") {
    const completedDistributions = data.recipientRequests.filter(req => req.status === "Completed");
    return <DataPanel title="Completed Distributions" rows={completedDistributions} columns={["id", "recipientName", "bankName", "bloodGroup", "units", "requestDate", "status"]} />;
  }

  if (activePage === "Inventory") return <InventoryPage rows={data.inventory} />;
  return <DataPanel title="Bank Donations" rows={data.donations} columns={["id", "donor", "bank", "bloodGroup", "units", "status"]} />;
}

function SidebarCard({ session, totalUnits, bankSummary }) {
  const label = session.role === "bloodBank" ? "Blood Bank Portal" : session.role === "recipient" ? "Recipient Portal" : "Donor Portal";
  const value = session.role === "bloodBank" ? session.user.name : session.role === "recipient" ? `${totalUnits} units` : session.user.bloodGroup;
  const note = session.role === "bloodBank" ? `Stock ready: ${bankSummary?.availableUnits ?? 0} units` : session.role === "recipient" ? "Check matching blood groups across banks." : `Status: ${session.user.status}`;

  return (
    <div className="mb-8">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-200/80">{label}</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">Blood Donation MS</h1>
      <div className="mt-8 rounded-3xl bg-gradient-to-br from-brand-500/20 to-white/5 p-4 ring-1 ring-white/10">
        <p className="text-sm font-medium text-white">{session.role === "bloodBank" ? "Active Bank" : session.role === "recipient" ? "Visible Stock" : "Your Blood Group"}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-2 text-sm text-slate-300">{note}</p>
      </div>
    </div>
  );
}

function TopBar({ search, setSearch, activePage, session, onLogout }) {
  const workspace = session.role === "bloodBank" ? "Blood Bank Workspace" : session.role === "recipient" ? "Recipient Workspace" : "Donor Workspace";

  return (
    <div className="flex flex-col gap-4 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between md:p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-200/70">{workspace}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{activePage}</h2>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search backend data..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-400 sm:w-80"
        />
        <button onClick={onLogout} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-brand-100">Logout</button>
      </div>
    </div>
  );
}

function DonorDashboard({ user, eligibility, donations, donorRequests }) {
  return (
    <div className="space-y-6">
      <HeroCard eyebrow="Donor Dashboard" title={`Welcome back, ${user.name}`} description="Your donation activity and eligibility are now loaded from the backend API." />
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Blood Group" value={user.bloodGroup} note="Loaded from login profile" />
        <InfoCard title="Eligibility" value={eligibility?.eligibility ?? user.status} note={eligibility?.reason ?? "No eligibility note"} />
        <InfoCard title="My Requests" value={donorRequests.length} note={`${donorRequests.filter((item) => item.status === "Accepted by Blood Bank").length} accepted by blood bank`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SimpleListCard title="Recent Donations" rows={donations.map((item) => `${item.id} | ${item.bank} | ${item.status}`)} />
        <SimpleListCard title="Request Updates" rows={donorRequests.map((item) => `${item.id} | ${item.requestType} | ${item.status}`)} />
      </div>
    </div>
  );
}

function RecipientDashboard({ user, requests }) {
  return (
    <div className="space-y-6">
      <HeroCard eyebrow="Recipient Dashboard" title={`Welcome, ${user.name}`} description="Your requests and blood search results are now pulled from the backend API." />
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Required Blood Group" value={user.bloodGroup} note="Primary search group" />
        <InfoCard title="Request Count" value={requests.length} note={`${requests.filter((item) => item.status === "Accepted").length} accepted`} />
        <InfoCard title="Emergency Cases" value={requests.filter((item) => item.urgency === "Emergency").length} note="Urgency workflow enabled" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SimpleListCard title="Request Updates" rows={requests.map((item) => `${item.id} | ${item.bank} | ${item.status}`)} />
        <SimpleListCard title="System Alerts" rows={notifications} />
      </div>
    </div>
  );
}

function BloodBankDashboard({ summary, donorRequests, recipientRequests }) {
  return (
    <div className="space-y-6">
      <HeroCard eyebrow="Blood Bank Dashboard" title={`${summary?.name ?? "Blood Bank"} request center`} description="Donor requests, recipient requests, inventory, and donations are loaded from MySQL." />
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Pending Donor Requests" value={summary?.pendingDonorRequests ?? donorRequests.length} note="Waiting for review" />
        <InfoCard title="Pending Recipient Requests" value={summary?.pendingRecipientRequests ?? recipientRequests.length} note="Assigned to this bank" />
        <InfoCard title="Total Donations" value={summary?.totalDonations ?? 0} note="Bank donation records" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SimpleListCard title="Donor Request Queue" rows={donorRequests.map((item) => `${item.id} | ${item.donorName} | ${item.status}`)} />
        <SimpleListCard title="Recipient Demand" rows={recipientRequests.map((item) => `${item.id} | ${item.recipient} | ${item.urgency}`)} />
      </div>
    </div>
  );
}

function RecipientSearchPage({ user, banks, bloodGroupFilter, setBloodGroupFilter }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Search Blood" subtitle="Search matching blood across banks from the backend recommendation endpoint." />
      <div className="rounded-[28px] bg-white/5 p-6 ring-1 ring-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Matching Blood Banks</p>
            <p className="mt-1 text-sm text-slate-400">All matching active banks for the selected blood group.</p>
          </div>
          <select value={bloodGroupFilter} onChange={(event) => setBloodGroupFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-brand-400">
            {bloodGroups.map((group) => <option key={group} value={group} className="bg-slate-900">{group}</option>)}
          </select>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <p className="font-medium text-white">{user.name}</p>
          <p className="mt-2 text-sm text-slate-300">Requested Blood Group: {bloodGroupFilter === "All" ? user.bloodGroup : bloodGroupFilter}</p>
        </div>
        <div className="mt-5 grid gap-3">
          {banks.length ? banks.map((bank) => (
            <div key={bank.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{bank.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{bank.city} | {bank.contact}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bank.recommended ? <Badge status="Recommended" /> : null}
                  <Badge status={bank.status} />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-300">{bank.unitsAvailable} units of {bank.bloodGroup}</p>
            </div>
          )) : <EmptyState text="No matching blood banks found." />}
        </div>
      </div>
    </div>
  );
}

function RecipientOwnRequestsTab({ user, rows, bankOptions, onSubmit }) {
  const [form, setForm] = useState({
    bloodGroup: user.bloodGroup,
    bankCode: bankOptions[0]?.value ?? "",
    units: "1",
    urgency: "Medium",
    notes: "",
  });

  useEffect(() => {
    if (!form.bankCode && bankOptions.length) {
      setForm((current) => ({ ...current, bankCode: bankOptions[0].value }));
    }
  }, [bankOptions, form.bankCode]);

  return (
    <div className="space-y-6">
      <SectionHeader title="My Blood Requests" subtitle="Create blood requests here and track only your own recipient requests." actionLabel="Submit Request" onAction={() => onSubmit({ ...form, recipientCode: user.id })} />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <RequestFormCard
          title="Recipient Request Form"
          fields={[
            { key: "bloodGroup", label: "Blood Group", type: "select", options: bloodGroups.filter((item) => item !== "All") },
            { key: "bankCode", label: "Blood Bank", type: "select", options: bankOptions },
            { key: "units", label: "Units Needed", type: "input", placeholder: "1" },
            { key: "urgency", label: "Urgency", type: "select", options: urgencyLevels.filter((item) => item !== "All") },
            { key: "notes", label: "Notes", type: "textarea", placeholder: "Reason or case details" },
          ]}
          form={form}
          setForm={setForm}
          onSubmit={() => onSubmit({ ...form, recipientCode: user.id })}
          submitLabel="Create Request"
        />
        <RequestHistoryCard
          title="My Request History"
          rows={rows}
          renderRow={(row) => `${row.id} | ${row.bank} | ${row.bloodGroup} | ${row.status}`}
        />
      </div>
    </div>
  );
}

function DonorRequestTab({ user, rows, bankOptions, onSubmit }) {
  const [form, setForm] = useState({
    bloodGroup: user.bloodGroup,
    bankCode: bankOptions[0]?.value ?? "",
    preferredDate: "2026-04-10",
    requestType: "Donation Slot Request",
  });

  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    if (!form.bankCode && bankOptions.length) {
      setForm((current) => ({ ...current, bankCode: bankOptions[0].value }));
    }
  }, [bankOptions, form.bankCode]);

  useEffect(() => {
    if (!form.bankCode) return;
    fetch(`/api/blood-banks/${form.bankCode}/booked-dates`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setBookedDates(res.bookedDates);
      });
  }, [form.bankCode]);

  return (
    <div className="space-y-6">
      <SectionHeader title="My Donation Requests" subtitle="Create donor requests here and track only your own donor request history." actionLabel="Submit Request" onAction={() => onSubmit({ ...form, donorCode: user.id })} />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <RequestFormCard
          title="Donor Request Form"
          fields={[
            { key: "bloodGroup", label: "Blood Group", type: "select", options: bloodGroups.filter((item) => item !== "All") },
            { key: "bankCode", label: "Blood Bank", type: "select", options: bankOptions },
            { 
              key: "preferredDate", 
              label: "Preferred Date", 
              type: "input", 
              inputType: "date",
              validate: (val) => bookedDates.includes(val) ? "This blood bank has reached its appointment capacity for this date. Please select a different day." : null
            },
            { key: "requestType", label: "Request Type", type: "select", options: ["Donation Slot Request", "Emergency Donation Offer", "Camp Registration"] },
          ]}
          form={form}
          setForm={setForm}
          onSubmit={() => onSubmit({ ...form, donorCode: user.id })}
          submitLabel="Create Donor Request"
        />
        <RequestHistoryCard
          title="My Donor Request History"
          rows={rows}
          renderRow={(row) => `${row.id} | ${row.bank} | ${row.requestType} | ${row.status}`}
        />
      </div>
    </div>
  );
}

function ManagedRequestTable({
  title,
  subtitle,
  rows,
  columns,
  statusFilter,
  setStatusFilter,
  urgencyFilter,
  setUrgencyFilter,
  bloodGroupFilter,
  setBloodGroupFilter,
  actions,
  onStatusChange,
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="rounded-[28px] bg-white/5 p-4 ring-1 ring-white/10">
        <RequestFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          urgencyFilter={urgencyFilter}
          setUrgencyFilter={setUrgencyFilter}
          bloodGroupFilter={bloodGroupFilter}
          setBloodGroupFilter={setBloodGroupFilter}
        />
        <RequestActionTable rows={rows} columns={columns} actions={actions} onStatusChange={onStatusChange} />
      </div>
    </div>
  );
}

function InventoryPage({ rows }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Blood Stock Entries" subtitle="Individual batches tracked by collection and expiry, matching the ER Diagram specification." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.length ? rows.map((item) => (
          <div key={item.id} className="rounded-[24px] bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold text-white">{item.bloodGroup}</p>
              <Badge status={new Date(item.expiryDate) < new Date() ? "Expired" : "Active"} />
            </div>
            <p className="mt-4 text-sm text-slate-300">{item.bankName}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.unitsAvailable} <span className="text-sm font-normal text-slate-400">units</span></p>
            <div className="mt-5 flex justify-between text-xs tracking-wider text-slate-500">
              <div>
                <span className="block font-medium">COLLECTED</span>
                <span className="mt-1 block text-slate-300">{item.collectionDate ? item.collectionDate.slice(0, 10) : "Consolidated"}</span>
              </div>
              <div className="text-right">
                <span className="block font-medium">EXPIRES</span>
                <span className="mt-1 block text-brand-200">{item.expiryDate ? item.expiryDate.slice(0, 10) : "Variable"}</span>
              </div>
            </div>
          </div>
        )) : <EmptyState text="No inventory records found." />}
      </div>
    </div>
  );
}

function DataPanel({ title, rows, columns }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white/5 ring-1 ring-white/10">
      {title ? <div className="border-b border-white/10 px-4 py-4 text-lg font-semibold text-white">{title}</div> : null}
      <div className="scrollbar overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              {columns.map((column) => <th key={column} className="px-4 py-4 font-medium">{labelize(column)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-4 text-slate-200">
                    {column === "status" || column === "urgency" ? <Badge status={row[column]} /> : row[column] ?? "-"}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={columns.length}>No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestActionTable({ rows, columns, actions, onStatusChange }) {
  const [promptTarget, setPromptTarget] = useState(null);
  const [units, setUnits] = useState("1");

  function handleActionClick(rowId, actionStatus) {
    if (actionStatus === "Completed" && columns.includes("donorName")) {
      setPromptTarget({ rowId, status: actionStatus });
      setUnits("1");
    } else {
      onStatusChange(rowId, actionStatus);
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] bg-white/5 ring-1 ring-white/10">
      <div className="scrollbar overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              {columns.map((column) => <th key={column} className="px-4 py-4 font-medium">{labelize(column)}</th>)}
              <th className="px-4 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-4 text-slate-200">
                    {column === "status" || column === "urgency" ? <Badge status={row[column]} /> : row[column] ?? "-"}
                  </td>
                ))}
                <td className="px-4 py-4">
                  {promptTarget && promptTarget.rowId === row.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="number" min="1" value={units} onChange={(e) => setUnits(e.target.value)} className="w-16 rounded-lg border border-white/20 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none focus:border-brand-400" />
                      <button onClick={() => { onStatusChange(row.id, promptTarget.status, { units: Number(units) }); setPromptTarget(null); }} className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/50 hover:bg-emerald-500/30">Save Units</button>
                      <button onClick={() => setPromptTarget(null)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-white/10 hover:bg-white/10">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <button
                          key={`${row.id}-${action.status}`}
                          onClick={() => handleActionClick(row.id, action.status)}
                          className={`rounded-xl px-3 py-2 text-xs font-medium transition ${buttonTone(action.tone)}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={columns.length + 1}>No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfilePage({ profile, extra = "", statusOverride }) {
  return (
    <div className="space-y-6">
      <SectionHeader title="My Profile" subtitle="Profile details loaded from backend login/session data." />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[28px] bg-gradient-to-br from-brand-600/20 to-slate-900 p-6 ring-1 ring-white/10">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-3xl font-semibold text-white">{profile?.name?.[0] ?? "P"}</div>
          <h3 className="mt-5 text-2xl font-semibold text-white">{profile?.name}</h3>
          <p className="mt-2 text-slate-300">{profile?.bloodGroup ?? profile?.city} | {profile?.email}</p>
          <div className="mt-5">
            <Badge status={statusOverride ?? profile?.status ?? "Operational"} />
          </div>
          {extra ? <p className="mt-4 text-sm text-slate-300">{extra}</p> : null}
        </div>
        <div className="rounded-[28px] bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-lg font-semibold text-white">Record Information</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(profile || {}).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{key}</p>
                <p className="mt-2 text-sm text-slate-200">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCard({ eyebrow, title, description }) {
  return (
    <div className="rounded-[28px] bg-gradient-to-br from-brand-600/20 via-slate-900/70 to-slate-900 p-6 ring-1 ring-white/10">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-200/70">{eyebrow}</p>
      <h3 className="mt-3 max-w-xl text-3xl font-semibold text-white">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

function RequestFilters({ statusFilter, setStatusFilter, urgencyFilter, setUrgencyFilter, bloodGroupFilter, setBloodGroupFilter }) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-brand-400">
        {requestStatuses.map((item) => <option key={item} value={item} className="bg-slate-900">{item} Status</option>)}
      </select>
      <select value={urgencyFilter} onChange={(event) => setUrgencyFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-brand-400">
        {urgencyLevels.map((item) => <option key={item} value={item} className="bg-slate-900">{item} Urgency</option>)}
      </select>
      <select value={bloodGroupFilter} onChange={(event) => setBloodGroupFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none focus:border-brand-400">
        {bloodGroups.map((item) => <option key={item} value={item} className="bg-slate-900">{item} Blood Group</option>)}
      </select>
    </div>
  );
}

function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>
      {actionLabel && onAction ? <button onClick={onAction} className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-500">{actionLabel}</button> : null}
    </div>
  );
}

function InfoCard({ title, value, note }) {
  return (
    <div className="rounded-[24px] bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-brand-200">{note}</p>
    </div>
  );
}

function SimpleListCard({ title, rows }) {
  return (
    <div className="rounded-[28px] bg-white/5 p-6 ring-1 ring-white/10">
      <p className="text-lg font-semibold text-white">{title}</p>
      <div className="mt-5 space-y-3">
        {rows.length ? rows.map((row) => <div key={row} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">{row}</div>) : <EmptyState text="No records available." compact />}
      </div>
    </div>
  );
}

function RequestFormCard({ title, fields, form, setForm, onSubmit, submitLabel }) {
  const [errors, setErrors] = useState({});

  const handleValidationChange = (key, value, validate) => {
    setForm(curr => ({ ...curr, [key]: value }));
    if (validate) {
      setErrors(curr => ({ ...curr, [key]: validate(value) }));
    }
  };

  const handleValidSubmit = () => {
    // Run validation on all fields
    const newErrors = {};
    fields.forEach(f => { if (f.validate) newErrors[f.key] = f.validate(form[f.key]); });
    setErrors(newErrors);
    
    // Only submit if no active physical errors exist
    if (Object.values(newErrors).every(err => !err)) onSubmit();
  };

  return (
    <div className="rounded-[28px] bg-white/5 p-6 ring-1 ring-white/10">
      <p className="text-lg font-semibold text-white">{title}</p>
      <div className="mt-5 space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="mb-2 block text-sm text-slate-300">{field.label}</label>
            {field.type === "select" ? (
              <select value={form[field.key]} onChange={(event) => handleValidationChange(field.key, event.target.value, field.validate)} className={inputClass}>
                {field.options.map((option) => {
                  const normalized = typeof option === "string" ? { value: option, label: option } : option;
                  return <option key={normalized.value} value={normalized.value} className="bg-slate-900">{normalized.label}</option>;
                })}
              </select>
            ) : field.type === "textarea" ? (
              <textarea value={form[field.key]} onChange={(event) => handleValidationChange(field.key, event.target.value, field.validate)} className={`${inputClass} min-h-24`} placeholder={field.placeholder} />
            ) : (
              <input type={field.inputType || "text"} value={form[field.key]} onChange={(event) => handleValidationChange(field.key, event.target.value, field.validate)} className={inputClass} placeholder={field.placeholder} />
            )}
            {errors[field.key] && <p className="mt-1 text-xs text-rose-400">{errors[field.key]}</p>}
          </div>
        ))}
        <button onClick={handleValidSubmit} className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-50">
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function RequestHistoryCard({ title, rows, renderRow }) {
  return (
    <div className="rounded-[28px] bg-white/5 p-6 ring-1 ring-white/10">
      <p className="text-lg font-semibold text-white">{title}</p>
      <div className="mt-5 space-y-3">
        {rows.length ? rows.map((row) => <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">{renderRow(row)}</div>) : <EmptyState text="No requests found yet." compact />}
      </div>
    </div>
  );
}

function Alert({ type, message }) {
  return <div className={`mb-6 rounded-2xl px-4 py-3 text-sm ${type === "error" ? "bg-rose-500/10 text-rose-200" : "bg-sky-500/10 text-sky-200"}`}>{message}</div>;
}

function LoadingState() {
  return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">Loading backend data...</div>;
}

function EmptyState({ text, compact = false }) {
  return <div className={`rounded-2xl border border-white/10 bg-slate-950/40 text-sm text-slate-400 ${compact ? "p-4" : "p-6"}`}>{text}</div>;
}

const inputClass = "w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none focus:border-brand-400";

function buttonTone(tone = "primary") {
  if (tone === "danger") return "bg-rose-500/20 text-rose-100 hover:bg-rose-500/30";
  if (tone === "warning") return "bg-amber-500/20 text-amber-100 hover:bg-amber-500/30";
  if (tone === "neutral") return "bg-slate-700/60 text-slate-100 hover:bg-slate-700";
  return "bg-brand-600 text-white hover:bg-brand-500";
}

function Badge({ status }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusTone[status] ?? "bg-white/10 text-white ring-white/10"}`}>{status}</span>;
}

function labelize(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

function mapDonations(rows) {
  return rows.map((row) => ({
    id: row.idCode,
    donor: row.donorName,
    bank: row.bankName,
    bloodGroup: row.bloodGroup,
    units: row.units,
    status: row.status,
  }));
}

function mapDonorRequests(rows) {
  return rows.map((row) => ({
    id: row.idCode,
    donorName: row.donorName,
    bank: row.bankName,
    bloodGroup: row.bloodGroup,
    preferredDate: row.preferredDate?.slice?.(0, 10) ?? row.preferredDate,
    requestType: row.requestType,
    status: row.status,
  }));
}

function mapRecipientRequests(rows) {
  return rows.map((row) => ({
    id: row.idCode,
    recipient: row.recipientName,
    bank: row.bankName,
    bloodGroup: row.bloodGroup,
    units: row.units,
    urgency: row.urgency,
    status: row.status,
  }));
}

function mapInventory(rows) {
  return rows.map((row) => ({
    id: row.id,
    bankName: row.bankName,
    bloodGroup: row.bloodGroup,
    unitsAvailable: row.unitsAvailable,
    thresholdUnits: row.thresholdUnits,
    status: row.status,
  }));
}

function mapRecommendedBanks(rows) {
  return rows.map((row) => ({
    id: row.bankCode,
    name: row.name,
    city: row.city,
    contact: row.contact,
    bloodGroup: row.bloodGroup,
    unitsAvailable: row.unitsAvailable,
    status: row.status,
    recommended: Boolean(row.recommended),
  }));
}

function mapBankOptions(rows) {
  return rows.map((row) => ({
    value: row.idCode,
    label: `${row.name} (${row.idCode})`,
  }));
}

export default PortalShell;
