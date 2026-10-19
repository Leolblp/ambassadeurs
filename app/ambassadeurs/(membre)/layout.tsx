import Nav from "../_components/Nav";

export const dynamic = "force-dynamic";

export default function MembreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ paddingBottom: 96 }}>{children}</div>
      <Nav />
    </>
  );
}
