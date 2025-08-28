"use client";

const ErrorPage = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">Global Error</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Something went wrong. Please try again later.
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
