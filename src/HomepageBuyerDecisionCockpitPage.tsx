import { useMemo } from "react";
import { buildHomepageBuyerDecisionCockpitFromWorkspace } from "./homepageBuyerDecisionCockpit";
import QuickBuyerEvidencePackSharePage from "./QuickBuyerEvidencePackSharePage";
import { buildProofBackedSampleWorkspaceDraft } from "./sampleWorkspace";
import { SUBMISSION_PROOF } from "./submission";
import { decodeWorkspaceShareParam, WORKSPACE_SHARE_PARAM } from "./workspaceDraft";

function workspaceParamFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    return new URL(window.location.href).searchParams.get(WORKSPACE_SHARE_PARAM);
  } catch {
    return null;
  }
}

function workspaceRouteHref(path: string, workspaceParam: string | null, hash = "") {
  if (typeof window === "undefined") return path;
  const url = new URL(window.location.href);
  url.pathname = path;
  url.search = "";
  if (workspaceParam) url.searchParams.set(WORKSPACE_SHARE_PARAM, workspaceParam);
  url.hash = hash;
  return url.toString();
}

export default function HomepageBuyerDecisionCockpitPage() {
  const { homeHref, payloadText, responseReturnHref } = useMemo(() => {
    const workspaceParam = workspaceParamFromUrl();
    const fallback = buildProofBackedSampleWorkspaceDraft(undefined, SUBMISSION_PROOF.deployedUrl);
    const workspace = decodeWorkspaceShareParam(workspaceParam, fallback);
    const workspaceHomeHref = workspaceParam ? workspaceRouteHref("/", workspaceParam, "quick-workflow-intake") : "/#quick-workflow-intake";
    const cockpit = buildHomepageBuyerDecisionCockpitFromWorkspace({
      workspace,
      hrefs: {
        launchEvidenceHref: workspaceRouteHref("/launch-evidence", workspaceParam),
        launchRoomHref: workspaceRouteHref("/launch-room", workspaceParam),
        buyerEvidenceBoardHref: workspaceRouteHref("/buyer-evidence-board", workspaceParam),
        buyerProofRoomHref: workspaceRouteHref("/buyer-proof-room", workspaceParam)
      }
    });
    return {
      homeHref: workspaceHomeHref,
      payloadText: cockpit.payloadJson,
      responseReturnHref: workspaceHomeHref
    };
  }, []);

  return <QuickBuyerEvidencePackSharePage homeHref={homeHref} payloadText={payloadText} responseReturnHref={responseReturnHref} />;
}
