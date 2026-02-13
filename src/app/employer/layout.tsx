import { Metadata } from "next";
import EmployerLayoutClient from "./EmployerLayoutClient";

export const metadata: Metadata = {
  title: "Employer Dashboard",
};

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployerLayoutClient>{children}</EmployerLayoutClient>;
}
