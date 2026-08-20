import { notFound } from "next/navigation";
import { MerchantForm } from "@/components/admin/MerchantForm";
import { getMerchant } from "@/lib/api";
import { ApiError } from "@/types/product";

export default async function EditMerchantPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const merchant = await getMerchant((await params).id);
    return (
      <section>
        <h2 className="mb-6 text-xl font-semibold text-navy">Edit merchant</h2>
        <MerchantForm merchant={merchant} />
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
