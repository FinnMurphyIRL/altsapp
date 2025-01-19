const EmailConfirmed = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-100 to-purple-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-[#9b87f5] mb-4">Account Verified</h1>
        <p className="text-gray-600 mb-4">Your email has been successfully verified.</p>
        <a 
          href="/" 
          className="text-[#9b87f5] hover:text-[#8b75f4] underline"
        >
          Continue to AltsApp
        </a>
      </div>
    </div>
  );
};

export default EmailConfirmed;