export default function Chargement() {
  return (
    <div className="ecran" style={{ minHeight: "60dvh", alignItems: "center", justifyContent: "center" }} aria-busy="true" aria-label="Chargement">
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--bord)", borderTopColor: "var(--rouge)", animation: "tourne .8s linear infinite" }} />
      <style>{`@keyframes tourne{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
