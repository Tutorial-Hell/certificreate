import { BlackBorderTemplate } from "@/components/certificate/BlackBorderTemplate";

const placeholderData = {
  recipientName: "Jordan Alvarez",
  course: "Full-Stack Web Development",
  date: "Aug 9, 2026",
  instructorName: "Brad Traversy",
};

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="w-full max-w-3xl">
        <BlackBorderTemplate data={placeholderData} />
      </div>
    </div>
  );
}
