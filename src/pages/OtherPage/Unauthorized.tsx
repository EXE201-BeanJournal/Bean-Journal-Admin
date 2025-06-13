import { Link } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import PageMeta from "../../components/common/PageMeta";
import GridShape from "../../components/common/GridShape";
import { LockIcon } from "../../icons"; // Assuming LockIcon is exported from index

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function Unauthorized() {
  const { signOut } = useClerk();

  return (
    <>
      <PageMeta
        title="Unauthorized Access | Bean Journal Admin"
        description="Unauthorized access page for Bean Journal Admin"
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-white dark:bg-gray-900 z-1">
        <GridShape />
        <motion.div
          className="z-10 flex flex-col items-center w-full max-w-md text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
              }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <LockIcon className="w-24 h-24 mb-8 text-red-500" />
            </motion.div>
          </motion.div>

          <motion.h1
            className="mb-2 text-4xl font-bold text-gray-800 sm:text-5xl dark:text-white"
            variants={itemVariants}
          >
            Unauthorized Access
          </motion.h1>

          <motion.p
            className="mb-8 text-base text-gray-600 dark:text-gray-400 sm:text-lg"
            variants={itemVariants}
          >
            You do not have permission to view this page.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-4"
            variants={itemVariants}
          >
            <Link
              to="/profile"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Go to Profile
            </Link>
            <button
              onClick={() => signOut({ redirectUrl: "/signin" })}
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-white transition-colors bg-red-500 border border-transparent rounded-lg shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </motion.div>
        </motion.div>
        <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
          &copy; {new Date().getFullYear()} - BeanAdmin
        </p>
      </div>
    </>
  );
} 