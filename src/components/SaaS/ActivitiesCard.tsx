import React from 'react';

interface ActivityItemProps {
  userImage: string; 
  userName: string;
  action: string;
  details: string;
  time: string;
  isNew?: boolean;
  isLast?: boolean;
}

const activitiesData: Omit<ActivityItemProps, 'isLast'>[] = [
  {
    userImage: './images/user/user-01.jpg', // Placeholder, use actual paths if available
    userName: 'Francisco Gribbs',
    action: 'created invoice',
    details: 'PQ-4491C',
    time: 'Just Now',
    isNew: true,
  },
  {
    userImage: './images/user/user-03.jpg', 
    userName: 'Courtney Henry',
    action: 'created invoice',
    details: 'HK-234G',
    time: '15 minutes ago',
  },
  {
    userImage: './images/user/user-04.jpg',
    userName: 'Bessie Cooper',
    action: 'created invoice',
    details: 'LH-2891C',
    time: '5 months ago',
  },
  {
    userImage: './images/user/user-05.jpg', 
    userName: 'Theresa Webb',
    action: 'created invoice',
    details: 'CK-125NH',
    time: '2 weeks ago',
  },
];

const ActivityListItem: React.FC<ActivityItemProps> = ({ userImage, userName, action, details, time, isNew, isLast }) => {
  return (
    <div className={`relative flex ${isLast ? '' : 'mb-6'}`}>
      <div className="z-10 flex-shrink-0">
        <img alt={userName} className="size-10 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" src={userImage} />
      </div>
      <div className="ml-4">
        {isNew && (
          <div className="mb-1 flex items-center gap-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5.0625H14.0625L12.5827 8.35084C12.4506 8.64443 12.4506 8.98057 12.5827 9.27416L14.0625 12.5625H10.125C9.50368 12.5625 9 12.0588 9 11.4375V10.875M3.9375 10.875H9M3.9375 3.375H7.875C8.49632 3.375 9 3.87868 9 4.5V10.875M3.9375 15.9375V2.0625" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            <p className="text-theme-xs text-success-500 font-medium">New invoice</p>
          </div>
        )}
        <div className="flex items-baseline">
          <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{userName}</h3>
          <span className="text-theme-sm ml-2 font-normal text-gray-500 dark:text-gray-400">{action}</span>
        </div>
        <p className="text-theme-sm font-normal text-gray-500 dark:text-gray-400">{details}</p>
        <p className="text-theme-xs mt-1 text-gray-400">{time}</p>
      </div>
    </div>
  );
};

const ActivitiesCard: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Activities</h3>
        </div>
        <div className="relative inline-block">
            <button className="dropdown-toggle">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6"><path fillRule="evenodd" clipRule="evenodd" d="M10.2441 6C10.2441 5.0335 11.0276 4.25 11.9941 4.25H12.0041C12.9706 4.25 13.7541 5.0335 13.7541 6C13.7541 6.9665 12.9706 7.75 12.0041 7.75H11.9941C11.0276 7.75 10.2441 6.9665 10.2441 6ZM10.2441 18C10.2441 17.0335 11.0276 16.25 11.9941 16.25H12.0041C12.9706 16.25 13.7541 17.0335 13.7541 18C13.7541 18.9665 12.9706 19.75 12.0041 19.75H11.9941C11.0276 19.75 10.2441 18.9665 10.2441 18ZM11.9941 10.25C11.0276 10.25 10.2441 11.0335 10.2441 12C10.2441 12.9665 11.0276 13.75 11.9941 13.75H12.0041C12.9706 13.75 13.7541 12.9665 13.7541 12C13.7541 11.0335 12.9706 10.25 12.0041 10.25H11.9941Z" fill="currentColor"></path></svg>
            </button>
        </div>
      </div>
      <div className="relative max-h-[350px] overflow-y-auto custom-scrollbar">
        {/* The timeline vertical bar - adjust top/bottom based on content and image size if needed */} 
        {activitiesData.length > 1 && (
            <div className="absolute top-6 bottom-10 left-5 w-px bg-gray-200 dark:bg-gray-800"></div>
        )}
        {activitiesData.map((activity, index) => (
          <ActivityListItem 
            key={activity.userName + index} // Using userName + index as key, assuming details might not be unique enough if ids are not present
            {...activity} 
            isLast={index === activitiesData.length - 1} 
          />
        ))}
      </div>
    </div>
  );
};

export default ActivitiesCard; 