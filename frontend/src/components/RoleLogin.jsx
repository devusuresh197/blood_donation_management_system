import { useState } from "react";
import { login, registerDonor, registerRecipient } from "../lib/api";
import { z } from "zod";

const donorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.coerce.number().min(18, "Must be at least 18 years old").max(65, "Must be 65 or younger"),
  gender: z.enum(["Male", "Female", "Other"]),
  phn_no: z.string().min(10, "Contact must be valid (min 10 chars)"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  address: z.string().min(2, "Address is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const recipientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  req_blood_gp: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  hospital_details: z.string().min(2, "Hospital details is required"),
  urgency_level: z.enum(["Low", "Medium", "High", "Emergency"]),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const roleCards = [
  {
    key: "recipient",
    title: "Recipient Login",
    description: "Track your requests and update urgency parameters."
  },
  {
    key: "donor",
    title: "Donor Login",
    description: "Manage your profile and track donations."
  },
  {
    key: "bloodBank",
    title: "Blood Bank Login",
    description: "Monitor branch operations and update local stocks."
  }
];

function RoleLogin({ onLogin }) {
  const [role, setRole] = useState("recipient");
  const [form, setForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    phn_no: "",
    bloodGroup: "O+",
    address: "",
    req_blood_gp: "O+",
    hospital_details: "",
    urgency_level: "High",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function updateRegisterField(field, value) {
    setRegisterForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (role === "donor" && authMode === "register") {
        const parsed = donorSchema.safeParse(registerForm);
        if (!parsed.success) {
          setError(parsed.error.errors[0].message);
          setIsSubmitting(false);
          return;
        }
        const result = await registerDonor(parsed.data);
        onLogin({ role: result.role, user: normalizeUser(result.role, result.user) });
        return;
      }

      if (role === "recipient" && authMode === "register") {
        const parsed = recipientSchema.safeParse(registerForm);
        if (!parsed.success) {
          setError(parsed.error.errors[0].message);
          setIsSubmitting(false);
          return;
        }
        const result = await registerRecipient(parsed.data);
        onLogin({ role: result.role, user: normalizeUser(result.role, result.user) });
        return;
      }

      const result = await login(role, form.email, form.password);
      onLogin({ role: result.role, user: normalizeUser(result.role, result.user) });
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const accessLabel = role === "recipient" ? "Recipient Access" : role === "bloodBank" ? "Blood Bank Access" : role === "admin" ? "Admin Access" : "Donor Access";
  const heading = role === "recipient" ? (authMode === "register" ? "Register as Recipient" : "Login as Recipient") : role === "bloodBank" ? "Login as Blood Bank" : role === "admin" ? "Login as Admin" : authMode === "register" ? "Register as Donor" : "Login as Donor";
  const placeholder = role === "recipient" ? "karan@bloodcare.com" : role === "bloodBank" ? "redpulse@bloodcare.com" : role === "admin" ? "admin@bloodcare.com" : "aarav@bloodcare.com";

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 md:px-6">
      <div className="grid w-full gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="glass rounded-[32px] border border-white/10 p-8 shadow-glow flex flex-col pt-8 overflow-y-auto max-h-[90vh]">
          <p className="text-xs uppercase tracking-[0.4em] text-brand-200/80">Blood Care Portal</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-white mb-2">
            blood donation management system
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Donate blood, save lives.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {roleCards.map((item) => (
              <button
                key={item.key}
                onClick={() => { setRole(item.key); setAuthMode("login"); }}
                className={`rounded-[24px] border p-5 text-left transition ${role === item.key ? "border-brand-400 bg-brand-500/15 shadow-lg shadow-brand-950/30" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
              >
                <p className="text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              </button>
            ))}
          </div>

          {/* <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-2">
            <DemoCard title="Blood Bank Demo" lines={["Email: redpulse@bloodcare.com", "Password: bank123"]} />
            <DemoCard title="Recipient Demo" lines={["Email: karan@bloodcare.com", "Password: recipient123"]} />
            <DemoCard title="Donor Demo" lines={["Email: aarav@bloodcare.com", "Password: donor123"]} />
          </div> */}
        </section>

        <section className="glass rounded-[32px] border border-white/10 p-8 shadow-glow flex flex-col justify-center max-h-[90vh] overflow-y-auto">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-200/70">{accessLabel}</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{heading}</h2>
          <p className="mt-2 text-sm text-slate-400">Enter your credentials to manage records.</p>

          {(role === "donor" || role === "recipient") ? (
            <div className="mt-6 inline-flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
              {["login", "register"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAuthMode(mode)}
                  className={`rounded-2xl px-4 py-2 text-sm transition ${authMode === mode ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-white/10"}`}
                >
                  {mode === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {authMode === "register" && role === "donor" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name"><input value={registerForm.name} onChange={(event) => updateRegisterField("name", event.target.value)} className={inputClass} placeholder="Full name" /></Field>
                <Field label="Gender">
                  <select value={registerForm.gender} onChange={(event) => updateRegisterField("gender", event.target.value)} className={inputClass}>
                    {["Male", "Female", "Other"].map((item) => <option key={item} value={item} className="bg-slate-900">{item}</option>)}
                  </select>
                </Field>
                <Field label="Age"><input type="number" value={registerForm.age} onChange={(event) => updateRegisterField("age", event.target.value)} className={inputClass} placeholder="Age" /></Field>
                <Field label="Blood Group">
                  <select value={registerForm.bloodGroup} onChange={(event) => updateRegisterField("bloodGroup", event.target.value)} className={inputClass}>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((item) => <option key={item} value={item} className="bg-slate-900">{item}</option>)}
                  </select>
                </Field>
                <Field label="Address"><input value={registerForm.address} onChange={(event) => updateRegisterField("address", event.target.value)} className={inputClass} placeholder="Detailed Address" /></Field>
                <Field label="Phone No"><input value={registerForm.phn_no} onChange={(event) => updateRegisterField("phn_no", event.target.value)} className={inputClass} placeholder="+91..." /></Field>
                <Field label="Email"><input type="email" value={registerForm.email} onChange={(event) => updateRegisterField("email", event.target.value)} className={inputClass} placeholder="your@email.com" /></Field>
                <Field label="Password"><input type="password" value={registerForm.password} onChange={(event) => updateRegisterField("password", event.target.value)} className={inputClass} placeholder="Create password" /></Field>
              </div>
            )}

            {authMode === "register" && role === "recipient" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name"><input value={registerForm.name} onChange={(event) => updateRegisterField("name", event.target.value)} className={inputClass} placeholder="Full name" /></Field>
                <Field label="Hospital Details"><input value={registerForm.hospital_details} onChange={(event) => updateRegisterField("hospital_details", event.target.value)} className={inputClass} placeholder="E.g. Apollo Ward 4" /></Field>
                <Field label="Blood Group Needed">
                  <select value={registerForm.req_blood_gp} onChange={(event) => updateRegisterField("req_blood_gp", event.target.value)} className={inputClass}>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((item) => <option key={item} value={item} className="bg-slate-900">{item}</option>)}
                  </select>
                </Field>
                <Field label="Urgency Level">
                  <select value={registerForm.urgency_level} onChange={(event) => updateRegisterField("urgency_level", event.target.value)} className={inputClass}>
                    {["Low", "Medium", "High", "Emergency"].map((item) => <option key={item} value={item} className="bg-slate-900">{item}</option>)}
                  </select>
                </Field>
                <Field label="Email"><input type="email" value={registerForm.email} onChange={(event) => updateRegisterField("email", event.target.value)} className={inputClass} placeholder="your@email.com" /></Field>
                <Field label="Password"><input type="password" value={registerForm.password} onChange={(event) => updateRegisterField("password", event.target.value)} className={inputClass} placeholder="Create password" /></Field>
              </div>
            )}

            {authMode === "login" && (
              <>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Email</label>
                  <input
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className={inputClass}
                    placeholder={placeholder}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    className={inputClass}
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}
            {error ? <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Please Wait..." : authMode === "register" ? `Register ${role === "donor" ? "Donor" : "Recipient"}` : "Login"}
            </button>
          </form>

        </section>
      </div>
    </div>
  );
}

function normalizeUser(role, user) {
  if (role === "donor") {
    return {
      id: user.code,
      name: user.name,
      email: user.email,
      bloodGroup: user.bloodGroup,
      address: user.address,
      status: user.status,
    };
  }

  if (role === "recipient") {
    return {
      id: user.code,
      name: user.name,
      email: user.email,
      bloodGroup: user.bloodGroup,
      hospital_details: user.hospital_details,
      urgency_level: user.urgency_level,
    };
  }

  if (role === "admin") {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phn_no: user.phn_no
    }
  }

  // Blood Bank
  return {
    id: user.code,
    name: user.name,
    email: user.email,
    location: user.location,
    operating_hours: user.operating_hours,
    status: user.status,
  };
}

function DemoCard({ title, lines }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-5">
      <p className="text-sm font-medium text-white">{title}</p>
      <div className="mt-3 space-y-2 text-sm text-slate-300">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-400";

export default RoleLogin;
