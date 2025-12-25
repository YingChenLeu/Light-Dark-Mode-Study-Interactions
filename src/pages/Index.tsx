import { StudyProvider } from "@/contexts/StudyContext";
import { StudyContainer } from "@/components/study/StudyContainer";

const Index = () => {
  return (
    <StudyProvider>
      <StudyContainer />
    </StudyProvider>
  );
};

export default Index;
