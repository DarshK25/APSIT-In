import SignUpForm from "../../components/auth/SignUpForm";
const SignUpPage = () => {
	return (
	  <div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
		<div className='sm:mx-auto sm:w-full sm:max-w-md'>
		  <img
			className='mx-auto h-20 w-21 rounded-full'
			src='/public/ApsitInLogo.avif'
			alt='APSIT-In'
		  />
		  <h1 className="text-center text-4xl font-extrabold text-blue-600 mb-5">APSIT-In</h1>
		  <h2 className='text-center text-3xl font-bold text-gray-900'>
			Welcome to the Professional Community of APSIT-In
		  </h2>
		</div>
		<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md shadow-md'>
		  <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
			{/* Use the modified version of SignUpForm */}
			<SignUpForm />
  
			<div className='mt-6'>
			  <div className='relative'>
				<div className='absolute inset-0 flex items-center'>
				  <div className='w-full border-t border-gray-300'></div>
				</div>
				<div className='relative flex justify-center text-sm'>
				  <span className='px-2 bg-white text-gray-500'>Already on APSIT-In?</span>
				</div>
			  </div>
			  <div className='mt-6'>
				<a
				  href='/login' // Using a simple anchor link instead of `Link`
				  className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50'
				>
				  Sign in
				</a>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	);
  };
  
  export default SignUpPage;
  