package com.opsradar.app.presentation.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.opsradar.app.presentation.theme.*
import com.opsradar.app.presentation.viewmodels.ConnectionViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectionWizardScreen(
    connectionViewModel: ConnectionViewModel,
    onNavigateBack: () -> Unit,
    onConnectionComplete: () -> Unit
) {
    val state by connectionViewModel.uiState.collectAsState()
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Connect AWS Account", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BgDarkNavy)
            )
        },
        containerColor = BgDarkNavy
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Step Indicator Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "STEP ${state.step} OF 3",
                    color = AwsOrange,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = when (state.step) {
                        1 -> "Account Setup"
                        2 -> "IAM Role Creation"
                        else -> "Validate & Connect"
                    },
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }

            LinearProgressIndicator(
                progress = { (state.step / 3f) },
                color = AwsOrange,
                trackColor = BorderDark,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
            )

            if (state.isCompleted) {
                // Success View
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(SurfaceDarkNavy)
                        .border(1.dp, StatusGreen, RoundedCornerShape(8.dp))
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = StatusGreen,
                            modifier = Modifier.size(52.dp)
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "AWS Account Connected!",
                            color = TextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Successfully assumed IAM role via AWS STS. Read-only monitoring is now active.",
                            color = TextSecondary,
                            fontSize = 13.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(20.dp))
                        Button(
                            onClick = onConnectionComplete,
                            colors = ButtonDefaults.buttonColors(containerColor = AwsOrange)
                        ) {
                            Text("Open Dashboard", color = TextPrimary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            } else if (state.step == 1) {
                // Step 1: Account Name & Region
                Text(
                    text = "Identify Your AWS Account",
                    color = TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "Enter a memorable name for this AWS environment and choose the primary region to monitor.",
                    color = TextSecondary,
                    fontSize = 12.sp
                )

                OutlinedTextField(
                    value = state.accountName,
                    onValueChange = { connectionViewModel.setAccountName(it) },
                    label = { Text("Account Name (e.g. Production AWS, Staging)", color = TextSecondary) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AwsOrange,
                        unfocusedBorderColor = BorderDark,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = state.defaultRegion,
                    onValueChange = { connectionViewModel.setDefaultRegion(it) },
                    label = { Text("Default Region (e.g. us-east-1, eu-west-1)", color = TextSecondary) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AwsOrange,
                        unfocusedBorderColor = BorderDark,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                if (state.error != null) {
                    Text(text = state.error!!, color = StatusRed, fontSize = 12.sp)
                }

                Button(
                    onClick = { connectionViewModel.initiateConnection() },
                    enabled = !state.isLoading && state.accountName.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = AwsOrange),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(color = TextPrimary, modifier = Modifier.size(20.dp))
                    } else {
                        Text("Generate Connection Credentials", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            } else if (state.step == 2) {
                // Step 2: Instructions & Policies
                val initData = state.initiationData!!

                Text(
                    text = "Create IAM Monitoring Role",
                    color = TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "OpsRadar uses AWS cross-account role assumption with an External ID. Create an IAM Role in your AWS console with the details below, or launch our CloudFormation template.",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )

                // External ID Box (with copy button)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(SurfaceDarkNavy)
                        .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "UNIQUE EXTERNAL ID (REQUIRED)",
                                color = TextSecondary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            IconButton(onClick = {
                                copyToClipboard(context, initData.externalId, "External ID copied")
                            }) {
                                Icon(Icons.Default.ContentCopy, contentDescription = "Copy", tint = AwsOrange, modifier = Modifier.size(18.dp))
                            }
                        }
                        Text(
                            text = initData.externalId,
                            color = AwsOrange,
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Backend Principal ARN Box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(SurfaceDarkNavy)
                        .border(1.dp, BorderDark, RoundedCornerShape(8.dp))
                        .padding(14.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "BACKEND PRINCIPAL ARN",
                                color = TextSecondary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            IconButton(onClick = {
                                copyToClipboard(context, initData.backendPrincipalArn, "Principal ARN copied")
                            }) {
                                Icon(Icons.Default.ContentCopy, contentDescription = "Copy", tint = AwsOrange, modifier = Modifier.size(18.dp))
                            }
                        }
                        Text(
                            text = initData.backendPrincipalArn,
                            color = TextPrimary,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                // Trust Policy Copy Button
                OutlinedButton(
                    onClick = { copyToClipboard(context, initData.trustPolicyJson, "Trust policy JSON copied") },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Copy IAM Trust Policy JSON", fontSize = 12.sp)
                }

                // Permissions Policy Copy Button
                OutlinedButton(
                    onClick = { copyToClipboard(context, initData.permissionsPolicyJson, "Permissions policy JSON copied") },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Copy Read-Only Policy JSON", fontSize = 12.sp)
                }

                Button(
                    onClick = { connectionViewModel.goToStep3() },
                    colors = ButtonDefaults.buttonColors(containerColor = AwsOrange),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                ) {
                    Text("I've Created the Role → Enter Role ARN", color = TextPrimary, fontWeight = FontWeight.Bold)
                }
            } else if (state.step == 3) {
                // Step 3: Enter Role ARN & Validate
                Text(
                    text = "Verify AWS Role Connection",
                    color = TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "Enter your 12-digit AWS Account ID and the ARN of the IAM role you created.",
                    color = TextSecondary,
                    fontSize = 12.sp
                )

                OutlinedTextField(
                    value = state.accountId,
                    onValueChange = { connectionViewModel.setAccountId(it.trim()) },
                    label = { Text("AWS Account ID (12 digits)", color = TextSecondary) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AwsOrange,
                        unfocusedBorderColor = BorderDark,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = state.roleArn,
                    onValueChange = { connectionViewModel.setRoleArn(it.trim()) },
                    label = { Text("IAM Role ARN (e.g. arn:aws:iam::123456789012:role/OpsRadarReadOnly)", color = TextSecondary) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AwsOrange,
                        unfocusedBorderColor = BorderDark,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                if (state.error != null) {
                    Text(text = state.error!!, color = StatusRed, fontSize = 12.sp)
                }

                Button(
                    onClick = { connectionViewModel.completeConnection() },
                    enabled = !state.isLoading && state.accountId.length == 12 && state.roleArn.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = AwsOrange),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(color = TextPrimary, modifier = Modifier.size(20.dp))
                    } else {
                        Text("Validate & Connect via STS", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

private fun copyToClipboard(context: Context, text: String, label: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText(label, text)
    clipboard.setPrimaryClip(clip)
    Toast.makeText(context, label, Toast.LENGTH_SHORT).show()
}

