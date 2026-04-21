import dynamic from "next/dynamic";

const ClientPage = dynamic(() => import("../../components/clientpage"), {
  ssr: false,
});

export default function Page() {
  return <ClientPage />;
}