import React from 'react';
import { LuTrendingUpDown, LuWallet } from 'react-icons/lu';
import ThemeToggle from '../ThemeToggle';
import AuthHeroCard from '../AuthHeroCard';

const AuthLayout = ({ children }) => {
    return (
        <div className="flex bg-white dark:bg-gray-950">
            <div className="w-screen h-screen md:w-[60vw] px-8 sm:px-12 pt-8 pb-12 flex flex-col">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 flex items-center justify-center bg-primary text-white rounded-xl shadow-md shadow-purple-500/20">
                        <LuWallet className="text-lg" />
                    </div>
                    <h2 className="text-lg font-semibold text-black dark:text-white grow">Pocketly</h2>
                    <ThemeToggle />
                </div>

                <div className="flex-1 flex items-center">
                    {children}
                </div>
            </div>

            <div className="hidden md:flex w-[40vw] h-screen bg-gradient-to-br from-violet-100 via-violet-50 to-fuchsia-50 dark:from-violet-950 dark:via-gray-950 dark:to-fuchsia-950 bg-cover bg-no-repeat bg-center overflow-hidden p-8 relative items-start">

                <div className="w-48 h-48 rounded-[40px] bg-purple-600 absolute -top-7 -left-5 opacity-90" />
                <div className="w-48 h-56 rounded-[40px] border-[20px] border-fuchsia-600 absolute top-[30%] -right-10 opacity-80" />
                <div className="w-48 h-48 rounded-[40px] bg-violet-500 absolute -bottom-7 -left-5 opacity-90" />

                <div className="grid grid-cols-1 z-20 w-full">
                    <StatsInfoCard
                        icon={<LuTrendingUpDown />}
                        label="Track your income and expenses"
                        values="430,000"
                        color="bg-primary"
                    />
                </div>

                <AuthHeroCard />
            </div>
        </div>
    );
};

export default AuthLayout;


const StatsInfoCard = ({ icon, label, values, color }) => {
    return (
        <div className="flex gap-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl shadow-md shadow-purple-400/10 border border-gray-200/50 dark:border-gray-700/50 z-30">
            <div
                className={`w-12 h-12 flex items-center justify-center text-[26px] text-white ${color} rounded-full drop-shadow-xl`}
            >
                {icon}
            </div>

            <div>
                <h6 className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</h6>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">${values}</span>
            </div>
        </div>
    );
};
