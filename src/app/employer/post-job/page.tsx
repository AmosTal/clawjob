"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { auth } from "@/lib/firebase-client";

export default function PostJobPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Core fields
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");

  // Dynamic lists
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [benefits, setBenefits] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([""]);

  // Manager info
  const [managerName, setManagerName] = useState("");
  const [managerTitle, setManagerTitle] = useState("");
  const [managerTagline, setManagerTagline] = useState("");
  const [managerPhoto, setManagerPhoto] = useState("");

  // HR info
  const [hrName, setHrName] = useState("");
  const [hrTitle, setHrTitle] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [hrPhone, setHrPhone] = useState("");
  const [hrPhoto, setHrPhoto] = useState("");

  // Extras
  const [teamSize, setTeamSize] = useState("");
  const [culture, setCulture] = useState<string[]>([""]);

  if (!user || role !== "employer") {
    router.replace("/");
    return null;
  }

  function updateListItem(
    list: string[],
    setList: (v: string[]) => void,
    index: number,
    value: string
  ) {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  }

  function addListItem(list: string[], setList: (v: string[]) => void) {
    setList([...list, ""]);
  }

  function removeListItem(
    list: string[],
    setList: (v: string[]) => void,
    index: number
  ) {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !location.trim()) {
      showToast("Please fill in required fields", "error");
      return;
    }

    setSubmitting(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const salary =
        salaryMin && salaryMax
          ? `$${salaryMin}k - $${salaryMax}k`
          : salaryMin
            ? `$${salaryMin}k+`
            : salaryMax
              ? `Up to $${salaryMax}k`
              : undefined;

      const body = {
        role: title.trim(),
        company: company.trim(),
        location: location.trim(),
        salary,
        description: description.trim() || undefined,
        requirements: requirements.map((r) => r.trim()).filter(Boolean),
        benefits: benefits.map((b) => b.trim()).filter(Boolean),
        tags: tags.map((t) => t.trim()).filter(Boolean),
        manager: {
          name: managerName.trim(),
          title: managerTitle.trim(),
          tagline: managerTagline.trim(),
          photo: managerPhoto.trim(),
        },
        hr: {
          name: hrName.trim(),
          title: hrTitle.trim(),
          email: hrEmail.trim(),
          phone: hrPhone.trim() || undefined,
          photo: hrPhoto.trim(),
        },
        teamSize: teamSize.trim() || undefined,
        culture: culture.map((c) => c.trim()).filter(Boolean),
      };

      const res = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create job");
      }

      showToast("Job posted successfully!", "success");
      router.push("/employer");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to post job",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh justify-center bg-zinc-950">
      <div className="w-full max-w-[430px] px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <h1 className="text-lg font-bold text-white">Post a Job</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core Info */}
          <Section title="Job Details">
            <Input
              label="Job Title *"
              value={title}
              onChange={setTitle}
              placeholder="e.g. Senior Frontend Engineer"
            />
            <Input
              label="Company *"
              value={company}
              onChange={setCompany}
              placeholder="e.g. Acme Corp"
            />
            <Input
              label="Location *"
              value={location}
              onChange={setLocation}
              placeholder="e.g. San Francisco, CA (Remote)"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Salary Min (k)"
                value={salaryMin}
                onChange={setSalaryMin}
                placeholder="120"
                type="number"
              />
              <Input
                label="Salary Max (k)"
                value={salaryMax}
                onChange={setSalaryMax}
                placeholder="180"
                type="number"
              />
            </div>
            <TextArea
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Describe the role..."
            />
          </Section>

          {/* Tags */}
          <Section title="Tags">
            <DynamicList
              items={tags}
              setItems={setTags}
              placeholder="e.g. React, Remote, Full-time"
              onUpdate={updateListItem}
              onAdd={addListItem}
              onRemove={removeListItem}
            />
          </Section>

          {/* Requirements */}
          <Section title="Requirements">
            <DynamicList
              items={requirements}
              setItems={setRequirements}
              placeholder="e.g. 5+ years of React experience"
              onUpdate={updateListItem}
              onAdd={addListItem}
              onRemove={removeListItem}
            />
          </Section>

          {/* Benefits */}
          <Section title="Benefits">
            <DynamicList
              items={benefits}
              setItems={setBenefits}
              placeholder="e.g. Health insurance"
              onUpdate={updateListItem}
              onAdd={addListItem}
              onRemove={removeListItem}
            />
          </Section>

          {/* Manager Info */}
          <Section title="Hiring Manager">
            <Input
              label="Name"
              value={managerName}
              onChange={setManagerName}
              placeholder="Jane Smith"
            />
            <Input
              label="Title"
              value={managerTitle}
              onChange={setManagerTitle}
              placeholder="Engineering Manager"
            />
            <Input
              label="Tagline"
              value={managerTagline}
              onChange={setManagerTagline}
              placeholder="Building the future of..."
            />
            <Input
              label="Photo URL"
              value={managerPhoto}
              onChange={setManagerPhoto}
              placeholder="https://..."
            />
          </Section>

          {/* HR Info */}
          <Section title="HR Contact">
            <Input
              label="Name"
              value={hrName}
              onChange={setHrName}
              placeholder="John Doe"
            />
            <Input
              label="Title"
              value={hrTitle}
              onChange={setHrTitle}
              placeholder="Talent Acquisition"
            />
            <Input
              label="Email"
              value={hrEmail}
              onChange={setHrEmail}
              placeholder="hr@company.com"
              type="email"
            />
            <Input
              label="Phone"
              value={hrPhone}
              onChange={setHrPhone}
              placeholder="+1 555-0100"
            />
            <Input
              label="Photo URL"
              value={hrPhoto}
              onChange={setHrPhoto}
              placeholder="https://..."
            />
          </Section>

          {/* Team & Culture */}
          <Section title="Team & Culture">
            <Input
              label="Team Size"
              value={teamSize}
              onChange={setTeamSize}
              placeholder="e.g. 8-12 engineers"
            />
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Culture Attributes
            </label>
            <DynamicList
              items={culture}
              setItems={setCulture}
              placeholder="e.g. Collaborative"
              onUpdate={updateListItem}
              onAdd={addListItem}
              onRemove={removeListItem}
            />
          </Section>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Posting...
              </span>
            ) : (
              "Post Job"
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}

// ── Helper Components ───────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-300">{title}</h2>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-none"
      />
    </div>
  );
}

function DynamicList({
  items,
  setItems,
  placeholder,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: string[];
  setItems: (v: string[]) => void;
  placeholder?: string;
  onUpdate: (
    list: string[],
    setList: (v: string[]) => void,
    index: number,
    value: string
  ) => void;
  onAdd: (list: string[], setList: (v: string[]) => void) => void;
  onRemove: (
    list: string[],
    setList: (v: string[]) => void,
    index: number
  ) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => onUpdate(items, setItems, i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(items, setItems, i)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onAdd(items, setItems)}
        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add another
      </button>
    </div>
  );
}
