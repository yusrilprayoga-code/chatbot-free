"use client"
import AiComposeButton from "@/components/page";

export default function Home() {
  
  return (
    <AiComposeButton
      onGenerate={(content) => console.log(content)}
    />
  );
}
