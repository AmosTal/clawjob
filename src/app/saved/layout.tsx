import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Jobs",
};

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
