package org.nasdanika.mermaid.drawio.generator;

public record IntermediateSequenceFrame(
        String kind,
        String label,
        int startOrder,
        int endOrder,
        int depth,
        java.util.List<String> participantIds) {

    public IntermediateSequenceFrame(String kind, String label, int startOrder, int endOrder, int depth) {
        this(kind, label, startOrder, endOrder, depth, null);
    }
}
