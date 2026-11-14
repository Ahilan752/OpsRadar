package com.opsradar.app

import com.opsradar.app.core.Resource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ResourceTest {

    @Test
    fun resourceSuccess_holdsDataCorrectly() {
        val testData = "EC2 Instance Running"
        val successResource = Resource.Success(testData)
        assertEquals(testData, successResource.data)
    }

    @Test
    fun resourceError_holdsMessageAndCode() {
        val errorResource = Resource.Error("AWS IAM Access Denied", "AWS_ACCESS_DENIED")
        assertEquals("AWS IAM Access Denied", errorResource.message)
        assertEquals("AWS_ACCESS_DENIED", errorResource.code)
    }

    @Test
    fun resourceLoading_isInstance() {
        val loadingResource = Resource.Loading
        assertTrue(loadingResource is Resource.Loading)
    }
}

