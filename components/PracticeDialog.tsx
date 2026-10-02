import { Question } from "@/lib/types";

export function PracticeDialog({ questions, onClose }: { questions: Question[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-black/45 p-4">
      <div className="mx-auto my-8 w-full max-w-3xl rounded-[3px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#ececec] pb-4">
          <div><p className="text-[12px] font-semibold uppercase tracking-wide text-[#1b6f7c]">Practice set</p><h2 className="mt-1 text-xl font-semibold">{questions.length} selected questions</h2></div>
          <button onClick={onClose} className="text-[14px] text-[#666] hover:text-[#1f2328]">Close</button>
        </div>
        <div className="mt-5 space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border-b border-[#ececec] pb-6">
              <p className="text-[12px] font-semibold text-[#888]">QUESTION {index + 1}</p>
              <p className="mt-2 font-semibold leading-6">{question.text}</p>
              {question.options
                ? <div className="mt-3 grid gap-2">{question.options.map((option) => <button key={option} className="rounded-[3px] border border-[#dcdcdc] px-3 py-2 text-left text-[14px] hover:border-[#2b2f6b]">{option}</button>)}</div>
                : <textarea className="mt-3 h-24 w-full rounded-[3px] border border-[#dcdcdc] p-3 text-[14px] outline-none focus:border-[#2b2f6b]" placeholder="Write your response here (not saved)" />}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-2 rounded-[3px] bg-[#2b2f6b] px-4 py-2 text-[14px] font-semibold text-white">Finish practice</button>
      </div>
    </div>
  );
}
