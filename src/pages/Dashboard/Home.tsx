import PageMeta from "../../components/common/PageMeta";
import StatsCards from "../../components/SaaS/StatsCards";
import ChurnRateCard from "../../components/SaaS/ChurnRateCard";
import UserGrowthCard from "../../components/SaaS/UserGrowthCard";
import ConversionFunnelChart from "../../components/SaaS/ConversionFunnelChart";
import ProductPerformanceCard from "../../components/SaaS/ProductPerformanceCard";
import RecentInvoicesTable from "../../components/SaaS/RecentInvoicesTable";
import ActivitiesCard from "../../components/SaaS/ActivitiesCard";

export default function Home() {
  return (
    <>
      <PageMeta
        title="SaaS Dashboard | Bean Journal Admin"
        description="SaaS Dashboard for Bean Journal Admin application"
      />
      <div className="space-y-5 sm:space-y-6">
        <StatsCards />

        <div className="gap-6 space-y-5 sm:space-y-6 xl:grid xl:grid-cols-12 xl:space-y-0">
          <div className="xl:col-span-7 2xl:col-span-8">
            <div className="space-y-5 sm:space-y-6">
              <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 lg:items-stretch">
                <ChurnRateCard />
                <UserGrowthCard />
              </div>

              <ConversionFunnelChart />

              <RecentInvoicesTable />
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6 xl:col-span-5 2xl:col-span-4">
            <ProductPerformanceCard />
            <ActivitiesCard />
          </div>
        </div>
      </div>
    </>
  );
}
