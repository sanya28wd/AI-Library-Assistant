import { materialForId, sourcePath } from "@/lib/seed";
import { Question } from "@/lib/types";

/** Keep the original diagram, its inputs and its source question together in search and practice. */
export function QuestionVisualContext({ question }: { question: Question }) {
  const material = materialForId(question.materialId);
  return <>{question.visuals?.map((visual) => (
    <details key={`${visual.fileName}-${visual.caption}`} className="mt-3 rounded-[3px] border border-[#d6e8eb] bg-[#f3f9fa] p-3 text-[13px]">
      <summary className="cursor-pointer font-semibold text-[#2b2f6b]">View graph and source context · page {visual.page}</summary>
      <p className="mt-2 font-semibold">{visual.caption}</p>
      <p className="mt-2 leading-6">{visual.description}</p>
      <a href={sourcePath(visual.fileName)} target="_blank" rel="noreferrer" className="mt-3 block" aria-label={`Open full-size source image: ${visual.caption}`}>
        <img src={sourcePath(visual.fileName)} alt={`${visual.caption}. Diagram inputs are transcribed above.`} loading="lazy" className="h-auto w-full border border-[#dcdcdc] bg-white" />
      </a>
      <p className="mt-2">Original page includes other questions. Use the question number above to identify its diagram. Open the image to zoom.</p>
      {material && <a href={`${sourcePath(material.fileName)}#page=${visual.page}`} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-[#2b2f6b] underline">Original PDF · page {visual.page}</a>}
    </details>
  ))}</>;
}
