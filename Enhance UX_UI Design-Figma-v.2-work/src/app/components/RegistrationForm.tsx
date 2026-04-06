import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Loader2, Dog, Cat, Bird, MoreHorizontal, CheckCircle2, PawPrint } from 'lucide-react';

const primaryColor = "#c54327";

export function RegistrationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('U1234567890dummy');
  const [displayName, setDisplayName] = useState('ผู้ใช้งาน LINE');
  
  // Form States
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    petType: [] as string[],
    petCount: '',
    province: '',
    addressDetail: ''
  });

  useEffect(() => {
    // Check if LIFF is loaded
    const checkLiff = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).liff) {
        clearInterval(checkLiff);
        initLiff();
      }
    }, 100);

    const initLiff = async () => {
      try {
        const liff = (window as any).liff;
        await liff.init({ liffId: "2009630242-iPO8WjV7" });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        setUserId(profile.userId);
        setDisplayName(profile.displayName);
      } catch (err) {
        console.error("LIFF Error", err);
      }
    };

    // Fallback cleanup
    const timeout = setTimeout(() => {
      clearInterval(checkLiff);
      console.log("Mocking LIFF for preview environment (Timeout)");
    }, 5000);

    return () => {
      clearInterval(checkLiff);
      clearTimeout(timeout);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePetTypeToggle = (type: string) => {
    setFormData(prev => {
      const isSelected = prev.petType.includes(type);
      if (isSelected) {
        return { ...prev, petType: prev.petType.filter(t => t !== type) };
      } else {
        return { ...prev, petType: [...prev.petType, type] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionData = {
      userId,
      displayName,
      ...formData,
      petType: formData.petType.join(', ')
    };

    // Simulate google.script.run
    if (typeof window !== 'undefined' && (window as any).google?.script?.run) {
      (window as any).google.script.run
        .withSuccessHandler((res: string) => {
          setLoading(false);
          if (res === "Success") {
            // Navigate to member card to show status immediately
            navigate('/member', { state: { ...submissionData, newMember: true } });
          } else {
            alert("เกิดข้อผิดพลาด: " + res);
          }
        })
        .withFailureHandler((err: Error) => {
          setLoading(false);
          alert("ระบบขัดข้อง: " + err.message);
        })
        .registerNewMember(submissionData);
    } else {
      // Mock successful submission for preview
      setTimeout(() => {
        setLoading(false);
        navigate('/member', { state: { ...submissionData, newMember: true } });
      }, 1500);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-[#c54327] animate-spin mb-4" />
            <p className="text-[#c54327] font-medium text-lg">กำลังพาน้องไปลงทะเบียน...</p>
          </div>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#fdf6f5] text-[#c54327] mb-4">
            <PawPrint size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#c54327] mb-2">ยินดีต้อนรับสมาชิกใหม่ 🐾</h2>
          <p className="text-gray-500 text-sm">ลงทะเบียนวันนี้ รับทันที 10 แต้ม!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="userId" value={userId} />

          {/* Personal Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-1 h-5 bg-[#c54327] rounded-full"></div>
              <h3 className="font-semibold text-[#c54327] text-lg">ข้อมูลส่วนตัว</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อที่ใช้ใน LINE</label>
                <input 
                  type="text" 
                  value={displayName}
                  readOnly 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อจริง <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required 
                    placeholder="สมชาย"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c54327]/20 focus:border-[#c54327] transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">นามสกุล <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required 
                    placeholder="รักสัตว์"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c54327]/20 focus:border-[#c54327] transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required 
                  placeholder="08XXXXXXXX"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c54327]/20 focus:border-[#c54327] transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pet Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-1 h-5 bg-[#c54327] rounded-full"></div>
              <h3 className="font-semibold text-[#c54327] text-lg">ข้อมูลสัตว์เลี้ยงของคุณ</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สัตว์เลี้ยงที่เลี้ยง (เลือกได้หลายข้อ)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'สุนัข', label: 'สุนัข', icon: Dog },
                    { id: 'แมว', label: 'แมว', icon: Cat },
                    { id: 'นก', label: 'นก', icon: Bird },
                    { id: 'อื่นๆ', label: 'อื่นๆ', icon: MoreHorizontal },
                  ].map((pet) => (
                    <div 
                      key={pet.id}
                      onClick={() => handlePetTypeToggle(pet.id)}
                      className={`flex items-center p-3 rounded-xl cursor-pointer border-2 transition-all ${
                        formData.petType.includes(pet.id) 
                          ? 'border-[#c54327] bg-[#fdf6f5]' 
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`mr-3 ${formData.petType.includes(pet.id) ? 'text-[#c54327]' : 'text-gray-400'}`}>
                        <pet.icon size={20} />
                      </div>
                      <span className={`flex-1 text-sm font-medium ${formData.petType.includes(pet.id) ? 'text-[#c54327]' : 'text-gray-700'}`}>
                        {pet.label}
                      </span>
                      {formData.petType.includes(pet.id) && (
                        <CheckCircle2 size={16} className="text-[#c54327]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">จำนวนสัตว์เลี้ยงทั้งหมด (ตัว)</label>
                <input 
                  type="number" 
                  name="petCount"
                  value={formData.petCount}
                  onChange={handleInputChange}
                  min="0" 
                  placeholder="ระบุจำนวน"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c54327]/20 focus:border-[#c54327] transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-1 h-5 bg-[#c54327] rounded-full"></div>
              <h3 className="font-semibold text-[#c54327] text-lg">ที่อยู่จัดส่ง</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">จังหวัด <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  required 
                  placeholder="กรุงเทพมหานคร"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c54327]/20 focus:border-[#c54327] transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">รายละเอียดที่อยู่ (บ้านเลขที่/ซอย/ถนน)</label>
                <textarea 
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="ระบุรายละเอียดที่อยู่..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c54327]/20 focus:border-[#c54327] transition-all outline-none resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full bg-[#c54327] text-white py-4 rounded-xl font-bold text-lg shadow-[0_8px_20px_rgba(197,67,39,0.3)] hover:bg-[#a0361f] transition-colors"
          >
            ยืนยันและรับแต้ม ✨
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
