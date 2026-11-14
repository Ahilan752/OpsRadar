package com.opsradar.app

import com.opsradar.app.data.models.EC2InstanceDto
import com.opsradar.app.data.models.EC2ListResponse
import org.junit.Assert.assertEquals
import org.junit.Test

class EC2ModelsTest {

    @Test
    fun ec2InstanceModel_instantiatesCorrectly() {
        val instance = EC2InstanceDto(
            id = "i-0123456789abcdef0",
            name = "production-web-server-01",
            type = "t3.medium",
            state = "running",
            region = "us-east-1",
            availabilityZone = "us-east-1a",
            privateIp = "10.0.1.50",
            publicIp = "54.210.12.34",
            tags = mapOf("Environment" to "Production", "Project" to "OpsRadar")
        )

        val listResponse = EC2ListResponse(
            instances = listOf(instance),
            total = 1,
            running = 1,
            stopped = 0
        )

        assertEquals("i-0123456789abcdef0", listResponse.instances[0].id)
        assertEquals("running", listResponse.instances[0].state)
        assertEquals(1, listResponse.running)
        assertEquals(0, listResponse.stopped)
        assertEquals("Production", listResponse.instances[0].tags["Environment"])
    }
}
