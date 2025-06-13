import { SignIn } from "@clerk/clerk-react";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignInPage() {
  return (
    <>
      <PageMeta
        title="Sign In | Bean Journal"
        description="Sign in to your Bean Journal account."
      />
      <AuthLayout>
        <div className="flex items-center justify-center w-full">
          <SignIn />
        </div>
      </AuthLayout>
    </>
  );
}
