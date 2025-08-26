import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
  children: React.ReactNode;
}
const Layout = ({ children }: Props) => {
  return (
    <main>
      <Navbar />

      {children}
    </main>
  );
};
export default Layout;
