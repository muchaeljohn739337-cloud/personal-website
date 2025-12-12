export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 text-center">
      <h1 className="text-3xl font-bold text-emerald-600">
        Payment Successful ✔️
      </h1>
      <p className="mt-4 max-w-md text-sm text-slate-600">
        Your account top-up is being processed. The new balance will appear in
        your dashboard shortly.
      </p>
    </div>
  );
}
