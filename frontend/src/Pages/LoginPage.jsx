import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm.jsx";

const LoginPage = () => {
	return (
		<div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900'>
			<div className='sm:mx-auto sm:w-full sm:max-w-md'>
				<img className='mx-auto h-40 w-auto' src='ApsitINlogo.avif' alt='APSIT-In' />
                <h1 className='text-center text-3xl font-extrabold text-blue-600 dark:text-blue-400'>APSIT-In</h1>
				<h2 className='text-center text-3xl font-extrabold text-gray-900 dark:text-white'>Welcome Back to APSIT-In</h2>
			</div>

			<div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md shadow-md'>
				<div className='bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					<LoginForm />
					<div className='mt-6'>
						<div className='relative'>
							<div className='absolute inset-0 flex items-center'>
								<div className='w-full border-t border-gray-300 dark:border-gray-600'></div>
							</div>
							<div className='relative flex justify-center text-sm'>
								<span className='px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'>New to APSIT-In?</span>
							</div>
						</div>
						<div className='mt-6'>
							<Link
								to='/signup'
								className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
							>
								Join now
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
export default LoginPage;