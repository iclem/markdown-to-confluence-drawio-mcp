package org.nasdanika.mermaid.drawio.generator;

import java.io.IOException;

import com.fasterxml.jackson.databind.ObjectMapper;

public final class GeneratorMain {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private GeneratorMain() {
    }

    public static void main(String[] args) throws Exception {
        IntermediateDiagram diagram = OBJECT_MAPPER.readValue(System.in, IntermediateDiagram.class);
        String drawioXml = new DrawioGenerator().generate(diagram);
        System.out.print(drawioXml);
    }
}

