import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Award, ChevronLeft, CreditCard, Gift, Share2, Sparkles, UserCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export function MembershipCard() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;

  // Basic fallback if navigated directly without data
  const memberData = state || {
    firstName: 'สมาชิก',
    lastName: 'คนพิเศษ',
    displayName: 'User',
    newMember: false,
    phone: '08XXXXXXXX'
  };

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (memberData.newMember) {
      // Trigger confetti on successful registration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      setShowConfetti(true);
    }
  }, [memberData.newMember]);

  // Format phone number to obfuscate middle digits e.g., 081-XXX-XXXX
  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    if (phone.length === 10) {
      return `${phone.slice(0, 3)}-XXX-${phone.slice(7)}`;
    }
    return phone;
  };

  // Use useMemo to prevent ID changing on re-renders
  const memberId = React.useMemo(() => {
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    return `DPS-${randomNum}`;
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Header section with back button if not just registered */}
      <div className="w-full flex items-center justify-between mb-6 px-2">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-[#c54327]">สถานะบัตรสมาชิก</h1>
        <div className="w-10"></div> {/* Spacer to center the title */}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className="w-full"
      >
        {memberData.newMember && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-start mb-6 shadow-sm border border-green-100">
            <Sparkles className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">ยินดีด้วยค่ะ! ลงทะเบียนสำเร็จ ✨</p>
              <p className="text-xs mt-1 opacity-90">คุณได้รับ 10 แต้มแรกเข้าเรียบร้อยแล้ว</p>
            </div>
          </div>
        )}

        {/* The Card Design */}
        <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-xl mb-8 group">
          {/* Card Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#c54327] via-[#e25838] to-[#faaf73]"></div>
          
          {/* Decorative Pattern / Shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transform -translate-x-1/3 translate-y-1/3"></div>

          {/* Card Content */}
          <div className="relative h-full p-6 flex flex-col justify-between text-white z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl tracking-wide opacity-90 uppercase">Daily Pet Shop</h3>
                <p className="text-xs font-medium bg-white/20 inline-block px-2 py-1 rounded-md mt-1 backdrop-blur-sm">
                  SILVER MEMBER
                </p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <CreditCard size={24} />
              </div>
            </div>

            <div>
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Point Balance</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold tracking-tight">10</span>
                  <span className="text-sm font-medium opacity-80">PT</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Member Name</p>
                  <p className="font-medium text-lg tracking-wide uppercase">
                    {memberData.firstName} {memberData.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Member ID</p>
                  <p className="font-mono text-sm tracking-wider">{memberId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions / Information Section */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#fdf6f5] flex items-center justify-center text-[#c54327]">
              <UserCircle2 size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">เชื่อมต่อกับ LINE</p>
              <p className="font-medium text-gray-800 text-sm">{memberData.displayName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#fdf6f5] p-4 rounded-xl text-center border border-[#c54327]/10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#faaf73]/10 transition-colors">
              <Award className="w-6 h-6 text-[#c54327] mb-2" />
              <p className="text-sm font-medium text-gray-800">แลกของรางวัล</p>
            </div>
            <div className="bg-[#fdf6f5] p-4 rounded-xl text-center border border-[#c54327]/10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#faaf73]/10 transition-colors">
              <Gift className="w-6 h-6 text-[#c54327] mb-2" />
              <p className="text-sm font-medium text-gray-800">สิทธิพิเศษ</p>
            </div>
          </div>

          <button className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium transition-colors border border-gray-200">
            <Share2 size={18} />
            <span>บอกต่อเพื่อนรับแต้มเพิ่ม</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
