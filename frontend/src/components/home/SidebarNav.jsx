
const SidebarNav = ({ currentSlide, handleSlideChange }) => {

    return (
        <nav className='flex justify-evenly w-full overflow-x-hidden border-b-2 pb-3'>
            <button
                className={`text-xl ${currentSlide === 'Created Rides' ? 'text-white' : 'text-gray-500 scale-95'}`}
                onClick={() => handleSlideChange('Created Rides')}
            >
                Created Rides
            </button>
            <button
                className={`text-xl ${currentSlide === 'Joined Rides' ? 'text-white' : 'text-gray-500 scale-95'}`}
                onClick={() => handleSlideChange('Joined Rides')}
            >
                Joined Rides
            </button>
        </nav>
    )
};

export default SidebarNav;