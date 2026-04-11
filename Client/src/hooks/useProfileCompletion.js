import { useMemo } from'react';
import { useUser } from'../context/UserContext';
import { useMentor } from'../context/MentorContext';

export const useProfileCompletion = () => {
 const { user } = useUser();
 const { mentor } = useMentor();

 const completion = useMemo(() => {
 const account = user || mentor;
 if (!account) return 0;

 const isUser = !!user;
 let fields = [];
 let completedCount = 0;

 if (isUser) {
 // User Profile Fields (matching EditProfile.jsx and Onboarding.jsx logic)
 fields = [
 { name:'name', value: account.name },
 { name:'phone', value: account.phone },
 { name:'gender', value: account.gender },
 { name:'city', value: account.city },
 { name:'educationType', value: account.educationType },
 { name:'institute', value: account.institute || account.schoolName || account.collegeName },
 { name:'image', value: account.imageUrl || account.image }
 ];

 // Education specific fields
 if (account.educationType ==='school') {
 fields.push({ name:'class', value: account.class });
 if (['11th','12th'].includes(account.class)) {
 fields.push({ name:'stream', value: account.stream });
 }
 } else if (account.educationType ==='college') {
 fields.push({ name:'courseLevel', value: account.courseLevel });
 fields.push({ name:'courseDetails', value: account.courseDetails });
 } else {
 // If education type not selected yet, count as 2 more pending fields (for a standard profile)
 fields.push({ name:'edu1', value: null });
 fields.push({ name:'edu2', value: null });
 }
 
 // Optional/Bonus fields (Social/Competitive)
 fields.push({ name:'username', value: account.username });
 fields.push({ name:'exams', value: (account.examsPreparingFor && account.examsPreparingFor.length > 0) });
 } else {
 // Mentor Profile Fields
 fields = [
 { name:'name', value: account.name },
 { name:'username', value: account.username },
 { name:'college', value: account.college },
 { name:'course', value: account.course },
 { name:'tagline', value: account.tagline },
 { name:'bio', value: account.bio },
 { name:'image', value: account.imageUrl || account.image },
 { name:'dob', value: account.dateOfBirth },
 { name:'exams', value: (account.competitiveExamsCleared && account.competitiveExamsCleared.length > 0) }
 ];
 }

 completedCount = fields.filter(f => {
 if (typeof f.value ==='boolean') return f.value;
 if (f.value === null || f.value === undefined) return false;
 if (typeof f.value ==='string') return f.value.trim() !=='';
 if (typeof f.value ==='object') {
 // For objects like college { name, id }
 return f.value.name ? f.value.name.trim() !=='': Object.keys(f.value).length > 0;
 }
 return !!f.value;
 }).length;

 return Math.round((completedCount / fields.length) * 100);
 }, [user, mentor]);

 return completion;
};
